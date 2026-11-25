"""Authorized RAG Vector Store backed by Qdrant (optional) or persistent SQLite + NumPy cosine index."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

from app.config.settings import Settings
from app.rag.embeddings import EmbeddingEngine
from app.schemas.security import AiSecurityContext
from app.security.rbac import normalize_role


class AuthorizedRagVectorStore:
    """Stores document metadata + chunk vectors with strict tenant and role ACL filtering."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._db_path: Path = settings.resolved_sqlite_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._embedder = EmbeddingEngine(settings)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS rag_documents (
                    doc_id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    source_ref TEXT NOT NULL,
                    allowed_roles_json TEXT NOT NULL,
                    chunk_count INTEGER NOT NULL DEFAULT 0,
                    embedding_backend TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS rag_chunks (
                    chunk_id TEXT PRIMARY KEY,
                    doc_id TEXT NOT NULL,
                    tenant_id TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    chunk_text TEXT NOT NULL,
                    embedding_json TEXT NOT NULL,
                    embedding_dim INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_rag_chunks_tenant ON rag_chunks (tenant_id, doc_id);
                """
            )
            conn.commit()

    def count_documents(self, tenant_id: str) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(*) AS cnt FROM rag_documents WHERE tenant_id = ?",
                (tenant_id,),
            ).fetchone()
            return int(row["cnt"] if row else 0)

    def upsert_document(
        self,
        *,
        doc_id: str,
        tenant_id: str,
        title: str,
        category: str,
        source_ref: str,
        allowed_roles: list[str],
        chunks: list[str],
    ) -> dict[str, Any]:
        clean_chunks = [c.strip() for c in chunks if c.strip()]
        vectors = self._embedder.embed_texts(clean_chunks)
        now = datetime.now(timezone.utc).isoformat()
        roles_norm = [r.strip() for r in allowed_roles if r.strip()] or ["All"]

        with self._connect() as conn:
            conn.execute("DELETE FROM rag_chunks WHERE doc_id = ? AND tenant_id = ?", (doc_id, tenant_id))
            conn.execute(
                """
                INSERT INTO rag_documents (
                    doc_id, tenant_id, title, category, source_ref, allowed_roles_json,
                    chunk_count, embedding_backend, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(doc_id) DO UPDATE SET
                    title = excluded.title,
                    category = excluded.category,
                    source_ref = excluded.source_ref,
                    allowed_roles_json = excluded.allowed_roles_json,
                    chunk_count = excluded.chunk_count,
                    embedding_backend = excluded.embedding_backend,
                    updated_at = excluded.updated_at
                """,
                (
                    doc_id,
                    tenant_id,
                    title,
                    category,
                    source_ref,
                    json.dumps(roles_norm),
                    len(clean_chunks),
                    self._embedder.backend_name,
                    now,
                ),
            )
            for idx, (chunk_text, vec) in enumerate(zip(clean_chunks, vectors)):
                conn.execute(
                    """
                    INSERT INTO rag_chunks (chunk_id, doc_id, tenant_id, chunk_index, chunk_text, embedding_json, embedding_dim)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        f"{doc_id}#{idx}",
                        doc_id,
                        tenant_id,
                        idx,
                        chunk_text,
                        json.dumps(vec),
                        len(vec),
                    ),
                )
            conn.commit()

        return {
            "doc_id": doc_id,
            "title": title,
            "category": category,
            "allowed_roles": roles_norm,
            "chunk_count": len(clean_chunks),
            "embedding_backend": self._embedder.backend_name,
            "updated_at": now,
        }

    def list_documents_raw(self, tenant_id: str) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM rag_documents WHERE tenant_id = ?",
                (tenant_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def _is_role_allowed(self, role: str, allowed_roles: list[str]) -> bool:
        if any(r.lower() == "all" for r in allowed_roles):
            return True
        if role in {"Super Admin", "Admin"}:
            return True
        norm_set = {normalize_role(r) for r in allowed_roles}
        return normalize_role(role) in norm_set

    def list_documents(self, ctx: AiSecurityContext) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM rag_documents WHERE tenant_id = ? ORDER BY updated_at DESC",
                (ctx.tenant_id,),
            ).fetchall()

        visible: list[dict[str, Any]] = []
        for r in rows:
            roles = json.loads(r["allowed_roles_json"])
            if not self._is_role_allowed(ctx.role, roles):
                continue
            visible.append(
                {
                    "doc_id": r["doc_id"],
                    "title": r["title"],
                    "category": r["category"],
                    "source_ref": r["source_ref"],
                    "allowed_roles": roles,
                    "chunk_count": r["chunk_count"],
                    "embedding_backend": r["embedding_backend"],
                    "updated_at": r["updated_at"],
                }
            )
        return visible

    def delete_document(self, ctx: AiSecurityContext, doc_id: str) -> bool:
        with self._connect() as conn:
            conn.execute("DELETE FROM rag_chunks WHERE doc_id = ? AND tenant_id = ?", (doc_id, ctx.tenant_id))
            cur = conn.execute("DELETE FROM rag_documents WHERE doc_id = ? AND tenant_id = ?", (doc_id, ctx.tenant_id))
            conn.commit()
            return cur.rowcount > 0

    def search(
        self,
        ctx: AiSecurityContext,
        query: str,
        *,
        top_k: int = 5,
        category: str | None = None,
    ) -> list[dict[str, Any]]:
        q_vecs = self._embedder.embed_texts([query])
        if not q_vecs:
            return []
        q_vec = np.asarray(q_vecs[0], dtype=np.float32)

        with self._connect() as conn:
            doc_sql = "SELECT * FROM rag_documents WHERE tenant_id = ?"
            doc_params: list[Any] = [ctx.tenant_id]
            if category:
                doc_sql += " AND LOWER(category) = LOWER(?)"
                doc_params.append(category.strip())
            docs = conn.execute(doc_sql, tuple(doc_params)).fetchall()

            allowed_docs: dict[str, dict[str, Any]] = {}
            for d in docs:
                roles = json.loads(d["allowed_roles_json"])
                if self._is_role_allowed(ctx.role, roles):
                    allowed_docs[d["doc_id"]] = dict(d)

            if not allowed_docs:
                return []

            placeholders = ",".join("?" for _ in allowed_docs)
            chunks = conn.execute(
                f"SELECT * FROM rag_chunks WHERE tenant_id = ? AND doc_id IN ({placeholders})",
                (ctx.tenant_id, *allowed_docs.keys()),
            ).fetchall()

        scored: list[dict[str, Any]] = []
        for ch in chunks:
            if int(ch["embedding_dim"]) != len(q_vec):
                continue
            vec = np.asarray(json.loads(ch["embedding_json"]), dtype=np.float32)
            sim = float(np.dot(q_vec, vec))
            doc = allowed_docs[ch["doc_id"]]
            scored.append(
                {
                    "doc_id": doc["doc_id"],
                    "title": doc["title"],
                    "category": doc["category"],
                    "source_ref": doc["source_ref"],
                    "chunk_index": int(ch["chunk_index"]),
                    "score": round(sim, 4),
                    "excerpt": ch["chunk_text"],
                }
            )

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]
