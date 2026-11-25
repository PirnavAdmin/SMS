"""Domain exception hierarchy for AI-Platform."""

from typing import Any, Optional


class AiPlatformError(Exception):
    """Base error for all AI-Platform exceptions."""

    status_code: int = 500
    error_code: str = "AI_PLATFORM_ERROR"

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        error_code: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code
        self.details = details or {}


class SecurityContextError(AiPlatformError):
    status_code = 401
    error_code = "INVALID_SECURITY_CONTEXT"


class AuthorizationDeniedError(AiPlatformError):
    status_code = 403
    error_code = "AUTHORIZATION_DENIED"


class ReadOnlyViolationError(AiPlatformError):
    status_code = 403
    error_code = "READ_ONLY_VIOLATION"


class BudgetExceededError(AiPlatformError):
    status_code = 429
    error_code = "AGENT_BUDGET_EXCEEDED"


class LlmProviderError(AiPlatformError):
    status_code = 502
    error_code = "LLM_PROVIDER_ERROR"


class ToolExecutionError(AiPlatformError):
    status_code = 500
    error_code = "TOOL_EXECUTION_ERROR"


class ErpBridgeError(AiPlatformError):
    status_code = 502
    error_code = "ERP_BRIDGE_ERROR"
