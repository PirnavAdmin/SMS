"""Application configuration for Pirnav SMS Autonomous AI Platform."""

from functools import lru_cache
from pathlib import Path
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Environment-driven settings with safe local defaults."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Pirnav SMS Autonomous AI Platform"
    app_env: Literal["development", "staging", "production", "test"] = "development"
    app_version: str = "2.0.0"
    ai_host: str = "127.0.0.1"
    ai_port: int = 8100
    log_level: str = "INFO"

    # Multi-LLM Engine
    llm_provider: Literal["mock", "gemini", "openai_compatible"] = "mock"
    llm_fallback_provider: Literal["mock", "gemini", "openai_compatible", "none"] = "mock"
    gemini_api_key: str = ""
    gemini_model_fast: str = "gemini-3.5-flash-lite"
    gemini_model_reasoning: str = "gemini-3.8-flash"
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    llm_request_timeout_seconds: float = 30.0

    # Service-to-Service Security & ERP Bridge
    ai_context_hmac_secret: str = Field(
        default="pirnav-dev-ai-bridge-hmac-secret-key-2026-32chars!",
        min_length=16,
    )
    ai_context_max_age_seconds: int = 120
    erp_base_url: str = "http://127.0.0.1:5151"
    erp_service_timeout_seconds: float = 15.0

    allow_direct_jwt_auth: bool = False
    jwt_secret_key: str = ""
    jwt_issuer: str = "SMS_NEW_API"
    jwt_audience: str = "SMS_NEW_Client"

    # Read-Only MySQL Analytical Connection
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_database: str = "sms_new_test"
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_readonly: bool = True
    mysql_pool_size: int = 5

    # Agent Budgets
    agent_max_iterations: int = 8
    agent_max_tool_calls: int = 15
    agent_max_tokens: int = 32000
    agent_timeout_seconds: float = 45.0
    agent_max_parallel_tools: int = 4

    # Memory, Cache, Queue, RAG
    memory_sqlite_path: str = "data/ai_platform.db"
    memory_ttl_seconds: int = 86400
    data_freshness_seconds: int = 300
    redis_url: str = ""
    celery_broker_url: str = ""
    qdrant_url: str = ""
    rag_docs_dir: str = "data/rag_docs"

    # Observability
    otel_enabled: bool = True
    otel_service_name: str = "pirnav-sms-ai-platform"

    @property
    def resolved_sqlite_path(self) -> Path:
        p = Path(self.memory_sqlite_path)
        return p if p.is_absolute() else (BASE_DIR / p)

    @property
    def resolved_rag_docs_dir(self) -> Path:
        p = Path(self.rag_docs_dir)
        return p if p.is_absolute() else (BASE_DIR / p)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
