"""Document upload, circular synchronization, and RAG knowledge index management endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.config.settings import get_settings
from app.rag.ingestor import (
    ensure_default_policy_docs,
    get_rag_store,
    ingest_uploaded_file,
    sync_erp_circulars_to_rag,
)
from app.schemas.security import AiSecurityContext
from app.security.context import get_security_context
from app.security.rbac import EXECUTIVE_ROLES

router = APIRouter(prefix="/api/v1/ai/documents", tags=["School Knowledge & RAG Documents"])


@router.get("")
async def list_documents(ctx: AiSecurityContext = Depends(get_security_context)) -> dict[str, Any]:
    settings = get_settings()
    store = get_rag_store()
    ensure_default_policy_docs(store, settings, ctx.tenant_id)
    return {"documents": store.list_documents(ctx)}


@router.post("")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(default="policy"),
    allowed_roles: str = Form(default="All"),
    ctx: AiSecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    if ctx.role not in EXECUTIVE_ROLES:
        raise HTTPException(status_code=403, detail="Only Super Admin, Admin, or Principal may upload school policy documents.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    roles_list = [r.strip() for r in allowed_roles.split(",") if r.strip()] or ["All"]
    doc = await ingest_uploaded_file(
        ctx=ctx,
        filename=file.filename or "document.txt",
        content=content,
        category=category,
        allowed_roles=roles_list,
        store=get_rag_store(),
        settings=get_settings(),
    )
    return {"success": True, "document": doc}


@router.post("/sync-circulars")
async def sync_circulars(ctx: AiSecurityContext = Depends(get_security_context)) -> dict[str, Any]:
    if ctx.role not in EXECUTIVE_ROLES:
        raise HTTPException(status_code=403, detail="Only Super Admin, Admin, or Principal may trigger circular indexing.")
    synced = await sync_erp_circulars_to_rag(ctx, get_rag_store())
    return {"success": True, "circulars_synced": synced}


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, ctx: AiSecurityContext = Depends(get_security_context)) -> dict[str, Any]:
    if ctx.role not in EXECUTIVE_ROLES:
        raise HTTPException(status_code=403, detail="Only Super Admin, Admin, or Principal may delete indexed documents.")
    deleted = get_rag_store().delete_document(ctx, doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"success": True}
