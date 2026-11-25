"""Embedding abstraction supporting Gemini embeddings with deterministic local vector fallback."""

from __future__ import annotations

import hashlib
import math
import re
from typing import Sequence

import numpy as np

from app.config.settings import Settings


class EmbeddingEngine:
    """Produces normalized float32 embedding vectors for semantic document search."""

    LOCAL_DIM = 256

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def backend_name(self) -> str:
        if self._settings.llm_provider == "gemini" and bool(self._settings.gemini_api_key.strip()):
            return "gemini-embedding-001"
        return "local-hashed-tfidf-256"

    def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        if self._settings.llm_provider == "gemini" and self._settings.gemini_api_key.strip():
            try:
                from google import genai  # type: ignore

                client = genai.Client(api_key=self._settings.gemini_api_key.strip())
                resp = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=list(texts),
                )
                return [list(emb.values) for emb in resp.embeddings]
            except Exception:
                # Safe deterministic fallback if network or key quota fails
                pass

        return [self._local_embed(t) for t in texts]

    @classmethod
    def _local_embed(cls, text: str) -> list[float]:
        vec = np.zeros(cls.LOCAL_DIM, dtype=np.float32)
        clean = text.lower()
        words = re.findall(r"[a-z0-9]{2,}", clean)
        tokens: list[str] = list(words)
        # Include word bigrams & 3-char trigrams for morphological tolerance
        for i in range(len(words) - 1):
            tokens.append(f"{words[i]}_{words[i + 1]}")
        for w in words:
            if len(w) >= 4:
                for j in range(len(w) - 2):
                    tokens.append(w[j : j + 3])

        for tok in tokens:
            digest = hashlib.blake2b(tok.encode("utf-8"), digest_size=8).digest()
            idx = int.from_bytes(digest[:4], "big") % cls.LOCAL_DIM
            sign = 1.0 if (digest[4] & 1) == 0 else -1.0
            weight = 1.5 if "_" in tok else (1.0 if len(tok) > 3 else 0.45)
            vec[idx] += sign * weight

        norm = math.sqrt(float(np.dot(vec, vec)))
        if norm > 1e-8:
            vec /= norm
        return [float(x) for x in vec]
