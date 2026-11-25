"""RAG policy, circular, and document search tool."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.config.settings import get_settings
from app.rag.ingestor import ensure_default_policy_docs, get_rag_store, sync_erp_circulars_to_rag
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput


class RagSearchInput(BaseModel):
    query: str = Field(min_length=2, max_length=500, description="Policy, circular, regulation, or procedure search query")
    category: Optional[str] = Field(default=None, description="Optional category e.g. fee_policy, academic_policy, circular")
    top_k: int = Field(default=4, ge=1, le=10)


class RagPolicySearchTool(BaseErpTool):
    name = "rag_search_documents"
    description = (
        "Searches indexed school policy handbooks, fee rules, academic regulations, HR procedures, "
        "uploaded school documents, and synced circulars with role ACL enforcement (`DOCUMENT_RAG`). "
        "Supplements live ERP database queries; never replaces live SQL queries."
    )
    module = "rag"
    allowed_roles = ("All",)
    input_model = RagSearchInput

    async def _run(self, ctx: AiSecurityContext, params: RagSearchInput) -> ToolOutput:
        settings = get_settings()
        store = get_rag_store()
        ensure_default_policy_docs(store, settings, ctx.tenant_id)
        try:
            await sync_erp_circulars_to_rag(ctx, store)
        except Exception:
            pass

        matches = store.search(ctx, params.query, top_k=params.top_k, category=params.category)
        return ToolOutput(
            success=True,
            module=self.module,
            source_type="DOCUMENT_RAG",
            record_count=len(matches),
            summary=(
                f"Retrieved {len(matches)} authorized policy/circular excerpt(s) (provenance: DOCUMENT_RAG, "
                f"distinct from LIVE_ERP records)."
            ),
            data={"matches": matches, "provenance": "DOCUMENT_RAG"},
            visuals=[
                VisualArtifact(
                    visual_type="table",
                    title="Policy & Circular Evidence (DOCUMENT_RAG)",
                    data={"rows": [{"Title": m["title"], "Category": m["category"], "Source": m["source_ref"], "Score": m["score"], "Excerpt": m["excerpt"][:240]} for m in matches]},
                )
            ]
            if matches
            else [],
        )


def get_rag_tools():
    return [RagPolicySearchTool()]
