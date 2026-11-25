"""Authenticated HTTP bridge client calling authoritative ASP.NET Core endpoints."""

from __future__ import annotations

import time
import uuid
from functools import lru_cache
from typing import Any

import httpx

from app.config.settings import Settings, get_settings
from app.core.exceptions import ErpBridgeError
from app.monitoring.telemetry import traced_span
from app.schemas.security import AiSecurityContext
from app.security.context import sign_ai_context


class ErpBridgeClient:
    """Sends HMAC-signed service-to-service requests to ASP.NET Core /api/internal/ai/*."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._base_url = settings.erp_base_url.rstrip("/")

    def _build_signed_headers(self, ctx: AiSecurityContext) -> dict[str, str]:
        payload = ctx.model_dump()
        payload["issued_at"] = int(time.time())
        payload["nonce"] = uuid.uuid4().hex[:12]
        token = sign_ai_context(payload, self._settings.ai_context_hmac_secret)
        return {
            "X-AI-Context": token,
            "X-Tenant-ID": ctx.tenant_id,
            "Accept": "application/json",
        }

    async def _request(
        self,
        method: str,
        path: str,
        ctx: AiSecurityContext,
        *,
        json_body: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = f"{self._base_url}{path}"
        headers = self._build_signed_headers(ctx)
        with traced_span("erp_bridge.request", {"method": method, "path": path}):
            try:
                async with httpx.AsyncClient(timeout=self._settings.erp_service_timeout_seconds) as client:
                    response = await client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        json=json_body,
                        params=params,
                    )
                if response.status_code >= 400:
                    raise ErpBridgeError(
                        f"ASP.NET Core bridge returned HTTP {response.status_code} for {path}: {response.text[:300]}",
                        status_code=response.status_code,
                    )
                data = response.json()
                return data if isinstance(data, dict) else {"data": data}
            except ErpBridgeError:
                raise
            except Exception as exc:
                raise ErpBridgeError(f"Failed contacting ASP.NET Core ERP bridge ({url}): {exc}") from exc

    async def get_branch_summary(self, ctx: AiSecurityContext) -> dict[str, Any]:
        return await self._request("GET", "/api/internal/ai/organization/summary", ctx)

    async def get_fee_collection_summary(
        self,
        ctx: AiSecurityContext,
        *,
        branch_id: int | None = None,
        academic_year_id: int | None = None,
    ) -> dict[str, Any]:
        params = {k: v for k, v in {"branchId": branch_id, "academicYearId": academic_year_id}.items() if v is not None}
        return await self._request("GET", "/api/internal/ai/fees/summary", ctx, params=params)

    async def get_hostel_summary(self, ctx: AiSecurityContext) -> dict[str, Any]:
        return await self._request("GET", "/api/internal/ai/hostel/summary", ctx)

    async def execute_write_action(
        self,
        ctx: AiSecurityContext,
        *,
        action_type: str,
        parameters: dict[str, Any],
    ) -> dict[str, Any]:
        return await self._request(
            "POST",
            "/api/internal/ai/actions/execute",
            ctx,
            json_body={"actionType": action_type, "parameters": parameters},
        )

    async def ping(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self._base_url}/api/internal/ai/ping")
                return resp.status_code == 200
        except Exception:
            return False


@lru_cache(maxsize=1)
def get_erp_bridge() -> ErpBridgeClient:
    return ErpBridgeClient(get_settings())
