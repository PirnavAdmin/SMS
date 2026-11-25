"""Signed HMAC-SHA256 service-to-service context token verification and FastAPI dependency."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any

import jwt
from fastapi import Depends, Header

from app.config.settings import Settings, get_settings
from app.core.exceptions import SecurityContextError
from app.monitoring.telemetry import metrics_collector
from app.schemas.security import AiSecurityContext
from app.security.rbac import normalize_role


def sign_ai_context(payload: dict[str, Any], secret: str) -> str:
    """Creates an HMAC-SHA256 signed token: `<base64url_json>.<hex_hmac>`."""
    body_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    b64_body = base64.urlsafe_b64encode(body_bytes).decode("ascii").rstrip("=")
    sig = hmac.new(secret.encode("utf-8"), b64_body.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{b64_body}.{sig}"


def verify_signed_ai_context(token: str, settings: Settings) -> AiSecurityContext:
    """Validates HMAC signature, expiration, and constructs authoritative AiSecurityContext."""
    if not token or "." not in token:
        metrics_collector.inc("security_denials_total")
        raise SecurityContextError("Missing or malformed X-AI-Context signature token.")

    b64_body, provided_sig = token.split(".", 1)
    expected_sig = hmac.new(
        settings.ai_context_hmac_secret.encode("utf-8"),
        b64_body.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(provided_sig.lower(), expected_sig.lower()):
        metrics_collector.inc("security_denials_total")
        raise SecurityContextError("Invalid X-AI-Context signature.")

    padded = b64_body + ("=" * ((4 - len(b64_body) % 4) % 4))
    try:
        raw_json = base64.urlsafe_b64decode(padded).decode("utf-8")
        data = json.loads(raw_json)
    except Exception as exc:
        metrics_collector.inc("security_denials_total")
        raise SecurityContextError(f"Corrupt X-AI-Context payload: {exc}") from exc

    issued_at = int(data.get("issued_at", 0))
    now = int(time.time())
    if issued_at <= 0 or (now - issued_at) > settings.ai_context_max_age_seconds or (issued_at - now) > 30:
        metrics_collector.inc("security_denials_total")
        raise SecurityContextError("Expired X-AI-Context token.")

    raw_role = str(data.get("raw_role") or data.get("role") or "")
    if not raw_role.strip():
        metrics_collector.inc("security_denials_total")
        raise SecurityContextError("Authenticated role missing in X-AI-Context.")

    data["raw_role"] = raw_role
    data["role"] = normalize_role(raw_role)
    return AiSecurityContext.model_validate(data)


def _decode_direct_jwt(authorization: str, settings: Settings) -> AiSecurityContext:
    """Optional standalone JWT mode when ASP.NET Core gateway is bypassed (requires matching JWT secret)."""
    if not settings.allow_direct_jwt_auth or not settings.jwt_secret_key:
        raise SecurityContextError("Direct JWT authentication is disabled; use signed ASP.NET Core bridge context.")

    if not authorization.lower().startswith("bearer "):
        raise SecurityContextError("Bearer JWT token required.")
    raw_jwt = authorization.split(" ", 1)[1].strip()
    try:
        claims = jwt.decode(
            raw_jwt,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except Exception as exc:
        metrics_collector.inc("security_denials_total")
        raise SecurityContextError(f"Invalid JWT token: {exc}") from exc

    uid_val = (
        claims.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
        or claims.get("sub")
        or claims.get("id")
        or 0
    )
    raw_role = (
        claims.get("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
        or claims.get("role")
        or ""
    )
    if isinstance(raw_role, list):
        raw_role = raw_role[0] if raw_role else ""
    if not uid_val or not raw_role:
        raise SecurityContextError("JWT lacks required user identifier or role claim.")

    name = (
        claims.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")
        or claims.get("unique_name")
        or claims.get("name")
        or "User"
    )
    email = claims.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") or claims.get("email") or ""
    tenant_id = str(claims.get("TenantId") or claims.get("tenant") or "tenant-default")
    school_id = claims.get("schoolId")
    staff_id = claims.get("StaffId") or claims.get("staff_id")

    return AiSecurityContext(
        user_id=int(uid_val),
        user_name=str(name),
        user_email=str(email),
        raw_role=str(raw_role),
        role=normalize_role(str(raw_role)),
        tenant_id=tenant_id,
        school_id=int(school_id) if school_id is not None and str(school_id).isdigit() else None,
        staff_id=int(staff_id) if staff_id is not None and str(staff_id).isdigit() else None,
        issued_at=int(time.time()),
    )


async def get_security_context(
    x_ai_context: str | None = Header(default=None, alias="X-AI-Context"),
    authorization: str | None = Header(default=None, alias="Authorization"),
    settings: Settings = Depends(get_settings),
) -> AiSecurityContext:
    """FastAPI dependency returning verified AiSecurityContext."""
    if x_ai_context:
        return verify_signed_ai_context(x_ai_context, settings)
    if authorization:
        return _decode_direct_jwt(authorization, settings)
    metrics_collector.inc("security_denials_total")
    raise SecurityContextError("Authentication context required (X-AI-Context or authorized Bearer JWT).")
