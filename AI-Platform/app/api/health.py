"""Health, readiness, and telemetry endpoints."""

from fastapi import APIRouter, Depends

from app.config.settings import Settings, get_settings
from app.monitoring.telemetry import metrics_collector
from app.schemas.common import DependencyStatus, HealthResponse

router = APIRouter(tags=["Platform Health & Observability"])


@router.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        llm_provider=settings.llm_provider,
        mysql_database=settings.mysql_database,
        mysql_readonly=settings.mysql_readonly,
        dependencies=[
            DependencyStatus(name="sqlite_memory", status="configured", details=str(settings.resolved_sqlite_path)),
            DependencyStatus(
                name="redis",
                status="configured" if settings.redis_url else "fallback_in_memory",
            ),
            DependencyStatus(
                name="qdrant",
                status="configured" if settings.qdrant_url else "fallback_local_vector",
            ),
        ],
    )


@router.get("/ready", response_model=HealthResponse)
async def ready(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return await health(settings)


@router.get("/metrics")
async def get_metrics() -> dict:
    return {
        "success": True,
        "metrics": metrics_collector.snapshot(),
    }
