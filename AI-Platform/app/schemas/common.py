"""Common API response, health, and telemetry schemas."""

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, Field


class DependencyStatus(BaseModel):
    name: str
    status: str
    details: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    llm_provider: str
    mysql_database: str
    mysql_readonly: bool
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    dependencies: list[DependencyStatus] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    success: bool = False
    error_code: str
    message: str
    trace_id: str = "-"
    details: dict[str, Any] = Field(default_factory=dict)
