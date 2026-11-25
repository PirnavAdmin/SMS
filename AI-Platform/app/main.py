"""FastAPI application entrypoint for Pirnav SMS Autonomous AI Platform."""

from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.health import router as health_router
from app.config.settings import Settings, get_settings
from app.core.exceptions import AiPlatformError
from app.core.logging import configure_logging, trace_id_var
from app.monitoring.telemetry import metrics_collector, setup_telemetry
from app.schemas.common import ErrorResponse

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = get_settings()
    configure_logging(settings.log_level)
    setup_telemetry(settings)
    settings.resolved_sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    settings.resolved_rag_docs_dir.mkdir(parents=True, exist_ok=True)
    logger.info(
        "Starting %s v%s (env=%s, llm=%s, mysql_db=%s, readonly=%s)",
        settings.app_name,
        settings.app_version,
        settings.app_env,
        settings.llm_provider,
        settings.mysql_database,
        settings.mysql_readonly,
    )
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Autonomous multi-step LangGraph ERP Intelligence Platform for Pirnav SMS.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://localhost:5151",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        req_trace = request.headers.get("X-Trace-Id") or uuid.uuid4().hex[:16]
        token = trace_id_var.set(req_trace)
        start = time.perf_counter()
        metrics_collector.inc("requests_total")
        try:
            response = await call_next(request)
            response.headers["X-Trace-Id"] = req_trace
            return response
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            metrics_collector.observe_latency(elapsed_ms)
            trace_id_var.reset(token)

    @app.exception_handler(AiPlatformError)
    async def ai_platform_error_handler(_request: Request, exc: AiPlatformError):
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error_code=exc.error_code,
                message=exc.message,
                trace_id=trace_id_var.get("-"),
                details=exc.details,
            ).model_dump(),
        )

    app.include_router(health_router)
    app.include_router(chat_router)
    app.include_router(documents_router)

    if settings.otel_enabled:
        FastAPIInstrumentor.instrument_app(app)

    return app


app = create_app()
