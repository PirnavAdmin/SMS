"""Structured logging setup with request correlation and secret redaction."""

import logging
import re
import sys
from contextvars import ContextVar


trace_id_var: ContextVar[str] = ContextVar("trace_id", default="-")

_SECRET_PATTERN = re.compile(
    r"(?i)(api[_-]?key|password|secret|authorization|bearer|token)\s*[:=]\s*([^\s,;\"']+)"
)


class RedactingTraceFilter(logging.Filter):
    """Injects trace_id and redacts accidental credential patterns from log lines."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.trace_id = trace_id_var.get("-")
        if isinstance(record.msg, str):
            record.msg = _SECRET_PATTERN.sub(r"\1=[REDACTED]", record.msg)
        return True


def configure_logging(level: str = "INFO") -> None:
    root = logging.getLogger()
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    root.setLevel(numeric_level)

    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)s | trace=%(trace_id)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        handler.setFormatter(formatter)
        handler.addFilter(RedactingTraceFilter())
        root.addHandler(handler)
    else:
        for h in root.handlers:
            if not any(isinstance(f, RedactingTraceFilter) for f in h.filters):
                h.addFilter(RedactingTraceFilter())
