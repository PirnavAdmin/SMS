"""Schemas for autonomous AI chat, investigation traces, visualizations, and actions."""

from datetime import datetime, timezone
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


SourceCategory = Literal["LIVE_ERP", "ANALYTICS_ENGINE", "ML_PREDICTION", "DOCUMENT_RAG", "SYSTEM"]


class AiChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=4000)
    requested_branch_id: Optional[int] = None
    requested_branch_name: Optional[str] = None
    requested_academic_year_id: Optional[int] = None
    requested_academic_year: Optional[str] = None
    stream: bool = False


class EvidenceItem(BaseModel):
    source_type: SourceCategory
    module: str
    tool_name: str
    record_count: int = 0
    summary: str
    verified: bool = True


class ToolExecutionSummary(BaseModel):
    tool_name: str
    module: str
    description: str
    success: bool
    duration_ms: float = 0.0
    record_count: int = 0
    summary: str = ""
    error: Optional[str] = None


class PendingActionPreview(BaseModel):
    action_type: str
    title: str
    description: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    confirmation_token: str
    expires_at: datetime


class InvestigationPlanSummary(BaseModel):
    objective: str
    modules_involved: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)
    completed_steps: int = 0
    iterations_used: int = 0
    contradictions_detected: list[str] = Field(default_factory=list)


class VisualArtifact(BaseModel):
    visual_type: Literal["table", "chart", "action_preview", "report", "none"] = "none"
    title: str = ""
    data: Any = None


class AiChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    reply: str
    visual_type: Optional[str] = None
    visual_data: Any = None
    additional_visuals: list[VisualArtifact] = Field(default_factory=list)
    tool_calls_executed: list[ToolExecutionSummary] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    investigation_plan: Optional[InvestigationPlanSummary] = None
    follow_up_questions: list[str] = Field(default_factory=list)
    pending_action: Optional[PendingActionPreview] = None
    tokens_used: int = 0
    latency_ms: float = 0.0
    provider_used: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
