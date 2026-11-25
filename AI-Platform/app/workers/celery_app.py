"""Celery application for optional asynchronous RAG indexing and periodic ERP audit snapshots."""

from __future__ import annotations

import asyncio

from celery import Celery

from app.config.settings import get_settings

settings = get_settings()
broker = settings.celery_broker_url or settings.redis_url or "memory://"

celery_app = Celery(
    "pirnav_ai_platform",
    broker=broker,
    backend=settings.redis_url or "cache+memory://",
)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "UTC"


@celery_app.task(name="pirnav_ai.sync_erp_circulars")
def sync_erp_circulars_task(tenant_id: str = "tenant-default") -> dict:
    """Refreshes ERP circulars into the authorized RAG vector store."""
    from app.rag.ingestor import get_rag_store, sync_erp_circulars_to_rag
    from app.schemas.security import AiSecurityContext
    import time

    ctx = AiSecurityContext(
        user_id=1,
        user_name="Celery Sync Worker",
        raw_role="Super Admin",
        role="Super Admin",
        tenant_id=tenant_id,
        issued_at=int(time.time()),
    )
    synced = asyncio.run(sync_erp_circulars_to_rag(ctx, get_rag_store()))
    return {"tenant_id": tenant_id, "circulars_synced": synced}
