"""SQLite persistence for two-phase confirmed ERP write action tokens."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app.schemas.security import AiSecurityContext


class PendingActionStore:
    """Stores pending write action tokens scoped to user_id and tenant_id."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS pending_actions (
                    token TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    user_role TEXT NOT NULL,
                    action_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    parameters_json TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    result_json TEXT,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    executed_at TEXT
                )
                """
            )
            conn.commit()

    def create_action(
        self,
        ctx: AiSecurityContext,
        *,
        action_type: str,
        title: str,
        description: str,
        parameters: dict[str, Any],
        ttl_minutes: int = 15,
    ) -> tuple[str, datetime]:
        token = f"ACT_{action_type.upper()}_{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=ttl_minutes)
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO pending_actions (
                    token, tenant_id, user_id, user_role, action_type, title, description,
                    parameters_json, status, created_at, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
                """,
                (
                    token,
                    ctx.tenant_id,
                    ctx.user_id,
                    ctx.role,
                    action_type,
                    title,
                    description,
                    json.dumps(parameters),
                    now.isoformat(),
                    expires.isoformat(),
                ),
            )
            conn.commit()
        return token, expires

    def get_action(self, token: str, ctx: AiSecurityContext) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT * FROM pending_actions
                WHERE token = ? AND tenant_id = ? AND user_id = ?
                """,
                (token, ctx.tenant_id, ctx.user_id),
            ).fetchone()
            return dict(row) if row else None

    def mark_status(self, token: str, status: str, result: dict[str, Any] | None = None) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE pending_actions
                SET status = ?, result_json = ?, executed_at = ?
                WHERE token = ?
                """,
                (status, json.dumps(result or {}), datetime.now(timezone.utc).isoformat(), token),
            )
            conn.commit()
