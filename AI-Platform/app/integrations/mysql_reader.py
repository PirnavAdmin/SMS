"""Strictly read-only parameterized MySQL analytical reader."""

from __future__ import annotations

import asyncio
import datetime
import decimal
import logging
import re
from functools import lru_cache
from typing import Any
from urllib.parse import quote_plus

from sqlalchemy import Engine, create_engine, event, text
from sqlalchemy.pool import QueuePool

from app.config.settings import Settings, get_settings
from app.core.exceptions import ReadOnlyViolationError
from app.monitoring.telemetry import metrics_collector, traced_span

logger = logging.getLogger(__name__)

_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(?:INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|"
    r"CALL|EXECUTE|PREPARE|DEALLOCATE|LOCK|UNLOCK|COMMIT|ROLLBACK|SAVEPOINT|"
    r"LOAD|OUTFILE|DUMPFILE|RENAME|HANDLER|DO|SET|USE|PURGE|RESET|SHUTDOWN)\b",
    re.IGNORECASE,
)


def _strip_sql_comments_and_literals(sql: str) -> tuple[str, bool]:
    """
    Removes string literals and SQL comments so keyword and multi-statement checks
    cannot be bypassed or confused by literal text. Returns (cleaned_sql, has_unquoted_semicolon).
    """
    out: list[str] = []
    i = 0
    n = len(sql)
    has_unquoted_semicolon = False
    while i < n:
        ch = sql[i]
        # Line comment -- ... or #
        if (ch == "-" and i + 1 < n and sql[i + 1] == "-") or ch == "#":
            while i < n and sql[i] != "\n":
                i += 1
            out.append(" ")
            continue
        # Block comment /* ... */
        if ch == "/" and i + 1 < n and sql[i + 1] == "*":
            end = sql.find("*/", i + 2)
            i = n if end == -1 else end + 2
            out.append(" ")
            continue
        # Quoted string or identifier literal ('...' "..." `...`)
        if ch in ("'", '"', "`"):
            quote = ch
            i += 1
            while i < n:
                if sql[i] == "\\":
                    i += 2
                    continue
                if sql[i] == quote:
                    if i + 1 < n and sql[i + 1] == quote:
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            out.append(" __LIT__ ")
            continue
        if ch == ";":
            # Allow a single optional trailing semicolon at the very end only if handled outside;
            # inside the body it's a multi-statement hazard.
            has_unquoted_semicolon = True
        out.append(ch)
        i += 1
    return "".join(out), has_unquoted_semicolon


def validate_readonly_sql(sql: str) -> str:
    """Validates that a SQL query is strictly a single SELECT or WITH query."""
    if not sql or not sql.strip():
        raise ReadOnlyViolationError("Empty SQL query rejected.")

    stripped = sql.strip()
    if stripped.endswith(";"):
        stripped = stripped[:-1].strip()

    cleaned, has_inner_semicolon = _strip_sql_comments_and_literals(stripped)
    if has_inner_semicolon:
        raise ReadOnlyViolationError("Multiple SQL statements or embedded semicolons are prohibited.")

    tokens = cleaned.strip().split()
    if not tokens:
        raise ReadOnlyViolationError("Empty SQL query after stripping comments.")

    first = tokens[0].upper()
    if first not in {"SELECT", "WITH"}:
        raise ReadOnlyViolationError(
            f"Only SELECT / WITH read-only queries are permitted; rejected statement starting with '{first}'."
        )

    match = _FORBIDDEN_KEYWORDS.search(cleaned)
    if match:
        raise ReadOnlyViolationError(
            f"Prohibited SQL keyword '{match.group(0)}' detected in read-only query."
        )

    return stripped


def _normalize_value(value: Any, *, preserve_decimal: bool) -> Any:
    if isinstance(value, decimal.Decimal):
        return value if preserve_decimal else float(round(value, 4))
    if isinstance(value, (datetime.datetime, datetime.date, datetime.time)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


class MySqlReadOnlyReader:
    """Thread-safe parameterized read-only MySQL reader bound to sms_new_test."""

    def __init__(self, settings: Settings) -> None:
        if not settings.mysql_readonly:
            raise ReadOnlyViolationError("MySqlReadOnlyReader refuses to initialize with mysql_readonly=False.")
        self._settings = settings
        user = quote_plus(settings.mysql_user)
        password = quote_plus(settings.mysql_password)
        url = (
            f"mysql+pymysql://{user}:{password}@"
            f"{settings.mysql_host}:{settings.mysql_port}/{settings.mysql_database}"
            "?charset=utf8mb4"
        )
        self._engine: Engine = create_engine(
            url,
            poolclass=QueuePool,
            pool_size=settings.mysql_pool_size,
            max_overflow=5,
            pool_pre_ping=True,
            pool_recycle=1800,
            connect_args={"connect_timeout": 8, "read_timeout": 12, "write_timeout": 12},
        )

        @event.listens_for(self._engine, "connect")
        def _set_readonly_on_connect(dbapi_connection: Any, _connection_record: Any) -> None:
            cursor = dbapi_connection.cursor()
            try:
                cursor.execute("SET SESSION TRANSACTION READ ONLY")
                cursor.execute("SET SESSION MAX_EXECUTION_TIME = 10000")
            finally:
                cursor.close()

    def _exec_sync(
        self,
        sql: str,
        params: dict[str, Any] | None = None,
        *,
        preserve_decimal: bool = False,
    ) -> list[dict[str, Any]]:
        safe_sql = validate_readonly_sql(sql)
        with self._engine.connect() as conn:
            conn.execute(text("SET TRANSACTION READ ONLY"))
            result = conn.execute(text(safe_sql), params or {})
            columns = list(result.keys())
            rows: list[dict[str, Any]] = []
            for row in result.fetchall():
                item = {
                    col: _normalize_value(val, preserve_decimal=preserve_decimal)
                    for col, val in zip(columns, row)
                }
                rows.append(item)
            return rows

    async def fetch_all(
        self,
        sql: str,
        params: dict[str, Any] | None = None,
        *,
        preserve_decimal: bool = False,
    ) -> list[dict[str, Any]]:
        with traced_span("mysql.readonly.query"):
            metrics_collector.inc("mysql_queries_total")
            return await asyncio.to_thread(
                self._exec_sync,
                sql,
                params,
                preserve_decimal=preserve_decimal,
            )

    async def fetch_one(
        self,
        sql: str,
        params: dict[str, Any] | None = None,
        *,
        preserve_decimal: bool = False,
    ) -> dict[str, Any] | None:
        rows = await self.fetch_all(sql, params, preserve_decimal=preserve_decimal)
        return rows[0] if rows else None

    async def fetch_scalar(self, sql: str, params: dict[str, Any] | None = None) -> Any:
        row = await self.fetch_one(sql, params, preserve_decimal=True)
        if not row:
            return None
        return next(iter(row.values()))

    async def ping(self) -> bool:
        try:
            val = await self.fetch_scalar("SELECT 1")
            return int(val or 0) == 1
        except Exception as exc:
            logger.warning("MySQL read-only ping failed: %s", exc)
            return False

    def dispose(self) -> None:
        self._engine.dispose()


@lru_cache(maxsize=1)
def get_mysql_reader() -> MySqlReadOnlyReader:
    return MySqlReadOnlyReader(get_settings())
