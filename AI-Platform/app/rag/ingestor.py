"""Document extraction, overlapping semantic chunking, circular sync, and starter policy indexing."""

from __future__ import annotations

import io
import re
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config.settings import Settings, get_settings
from app.integrations.mysql_reader import get_mysql_reader
from app.rag.vector_store import AuthorizedRagVectorStore
from app.schemas.security import AiSecurityContext


def chunk_text(text: str, *, chunk_size: int = 700, overlap: int = 120) -> list[str]:
    clean = re.sub(r"\n{3,}", "\n\n", text.replace("\r\n", "\n")).strip()
    if not clean:
        return []
    if len(clean) <= chunk_size:
        return [clean]

    chunks: list[str] = []
    start = 0
    step = max(chunk_size - overlap, 100)
    while start < len(clean):
        end = min(start + chunk_size, len(clean))
        chunks.append(clean[start:end].strip())
        if end >= len(clean):
            break
        start += step
    return chunks


def extract_text_from_bytes(filename: str, content: bytes) -> str:
    ext = Path(filename).suffix.lower()
    if ext in {".txt", ".md", ".csv", ".json", ".log"}:
        return content.decode("utf-8", errors="replace")
    if ext == ".pdf":
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        return "\n\n".join((page.extract_text() or "") for page in reader.pages)
    if ext == ".docx":
        from docx import Document

        doc = Document(io.BytesIO(content))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return content.decode("utf-8", errors="replace")


def ensure_default_policy_docs(store: AuthorizedRagVectorStore, settings: Settings, tenant_id: str) -> None:
    """Seeds or upgrades baseline policy reference handbook ONLY into AI-Platform local SQLite/disk (never MySQL)."""
    existing = {d["doc_id"]: d for d in store.list_documents_raw(tenant_id)} if hasattr(store, "list_documents_raw") else {}
    if store.count_documents(tenant_id) > 0:
        sample = existing.get("policy_attendance_regulations")
        if sample and sample.get("embedding_backend") == store._embedder.backend_name:
            return

    docs_dir = settings.resolved_rag_docs_dir
    docs_dir.mkdir(parents=True, exist_ok=True)
    baseline = [
        (
            "policy_attendance_regulations",
            "School Attendance & Leave Regulations",
            "academic_policy",
            "policies/attendance_regulations.md",
            ["All"],
            (
                "Pirnav School Attendance Policy:\n"
                "1. Minimum Mandatory Attendance: Students must maintain at least 75% cumulative attendance across "
                "scheduled academic sessions to be eligible for final term promotion and hall-ticket issuance.\n"
                "2. Early Intervention: Students falling below 75% attendance with concurrent overdue fee balances "
                "must be flagged for Parent-Teacher Counseling before exam lockouts.\n"
                "3. Medical Leave: Absences exceeding 3 consecutive school days require a medical certificate endorsed "
                "by the Class Teacher and Principal.\n"
                "4. Faculty Leave Review: Pending staff leave applications must be reviewed by HR or the Principal with audit remarks."
            ),
        ),
        (
            "policy_fee_and_concessions",
            "Fee Collection, Late Fine & Refund Procedures",
            "fee_policy",
            "policies/fee_policy.md",
            ["Super Admin", "Admin", "Principal", "Accountant", "Parent", "Student"],
            (
                "Pirnav School Fee & Concession Policy:\n"
                "1. Installment Terms: Fees may be configured as Full Annual Fee or Term-wise schedules in DynamicFeeStructures.\n"
                "2. Reconciliation Rule: Every FeePayment receipt must reconcile against StudentFeeAssignments.PaidAmount "
                "and LedgerEntries within the accounting period. Variances between feepayments and assigned credits must be escalated to Accountant/Principal review.\n"
                "3. Concessions & Scholarships: Merit scholarships and rule-based concessions require formal approval before altering DueAmount.\n"
                "4. Security Deposits: Hostel security deposits are tracked separately from recurring hostel room fees."
            ),
        ),
        (
            "policy_hr_payroll_confidentiality",
            "HR Payroll & Compensation Governance",
            "hr_procedure",
            "policies/hr_payroll_governance.md",
            ["Super Admin", "Admin", "Principal", "HR", "Accountant"],
            (
                "Pirnav HR & Payroll Governance Procedure:\n"
                "1. Access Restriction: Staff compensation, bank account numbers, PAN, Aadhaar, and payslip net pay are "
                "restricted exclusively to HR, Accountant, Principal, and Super Admin roles.\n"
                "2. Leave Deductions: Loss of Pay (LOP) adjustments reflect unapproved or excess leave days during payroll runs."
            ),
        ),
    ]
    for doc_id, title, cat, src, roles, body in baseline:
        store.upsert_document(
            doc_id=doc_id,
            tenant_id=tenant_id,
            title=title,
            category=cat,
            source_ref=src,
            allowed_roles=roles,
            chunks=chunk_text(body),
        )


async def ingest_uploaded_file(
    *,
    ctx: AiSecurityContext,
    filename: str,
    content: bytes,
    category: str,
    allowed_roles: list[str],
    store: AuthorizedRagVectorStore,
    settings: Settings,
) -> dict[str, Any]:
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(filename).name).strip("_") or "document.txt"
    target_dir = settings.resolved_rag_docs_dir / ctx.tenant_id
    target_dir.mkdir(parents=True, exist_ok=True)
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    saved_path = target_dir / f"{doc_id}_{safe_name}"
    saved_path.write_bytes(content)

    extracted = extract_text_from_bytes(safe_name, content)
    chunks = chunk_text(extracted)
    if not chunks:
        raise ValueError("No readable text extracted from uploaded document.")

    return store.upsert_document(
        doc_id=doc_id,
        tenant_id=ctx.tenant_id,
        title=Path(safe_name).stem,
        category=category or "policy",
        source_ref=f"uploaded/{safe_name}",
        allowed_roles=allowed_roles,
        chunks=chunks,
    )


async def sync_erp_circulars_to_rag(ctx: AiSecurityContext, store: AuthorizedRagVectorStore) -> int:
    mysql = get_mysql_reader()
    circulars = await mysql.fetch_all(
        "SELECT CircularId, Title, Category, Content, TargetAudience, CreatedDate, Author FROM circulars WHERE TenantId = :tid ORDER BY CreatedDate DESC",
        {"tid": ctx.tenant_id},
    )
    count = 0
    for c in circulars:
        aud = str(c.get("TargetAudience") or "ALL").upper()
        roles = ["All"]
        if "TEACHER" in aud or "STAFF" in aud:
            roles = ["Super Admin", "Admin", "Principal", "Teacher", "HR", "Staff"]
        elif "PARENT" in aud:
            roles = ["Super Admin", "Admin", "Principal", "Teacher", "Parent"]
        text_body = (
            f"Circular Title: {c.get('Title')}\n"
            f"Category: {c.get('Category')} | Audience: {aud} | Author: {c.get('Author')} | Date: {c.get('CreatedDate')}\n\n"
            f"{c.get('Content') or ''}"
        )
        store.upsert_document(
            doc_id=f"erp_circular_{c['CircularId']}",
            tenant_id=ctx.tenant_id,
            title=str(c.get("Title") or f"Circular #{c['CircularId']}"),
            category="circular",
            source_ref=f"mysql:circulars/{c['CircularId']}",
            allowed_roles=roles,
            chunks=chunk_text(text_body),
        )
        count += 1
    return count


@lru_cache(maxsize=1)
def get_rag_store() -> AuthorizedRagVectorStore:
    settings = get_settings()
    return AuthorizedRagVectorStore(settings)
