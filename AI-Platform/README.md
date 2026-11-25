# Pirnav SMS Autonomous AI Intelligence Platform

Enterprise autonomous multi-step ERP intelligence service built with Python 3.12, FastAPI, LangGraph, Gemini / OpenAI-compatible multi-LLM routing, Pandas/NumPy/Decimal analytical engines, ethically gated Scikit-Learn ML models, permissioned RAG search, OpenTelemetry observability, and ASP.NET Core HMAC-signed integration.

## Security & Read-Only Guarantees

- **Authoritative Gateway**: ASP.NET Core validates JWT identity, role claims, branch scope, parent-student child links, and teacher class assignments, then signs a short-lived `X-AI-Context` HMAC-SHA256 header (`120s` TTL).
- **Strictly Read-Only Analytics (`sms_new_test` / `sms_new`)**: `MySqlReadOnlyReader` rejects any non-`SELECT`/`WITH` SQL, blocks multi-statements/forbidden keywords, and executes `SET SESSION TRANSACTION READ ONLY` and `SET TRANSACTION READ ONLY` on every connection/query.
- **No LLM-Generated SQL**: All database queries are parameterized inside verified tool handlers (`app/tools/` & `app/analytics/`).
- **Two-Phase Write Actions**: Write proposals generate a user/tenant-scoped confirmation token in `AI-Platform/data/ai_platform.db`. Confirmed actions execute exclusively through ASP.NET Core `POST /api/internal/ai/actions/execute` and are logged to `audit_logs`.
- **Production Database Safety**: Development/evaluation uses `sms_new_test` read-only (`sms_new` untouched). AI conversations, memory snapshots, pending action tokens, ML run logs, and RAG indexes are stored inside `AI-Platform/data/ai_platform.db`.

## Local Setup (Windows / Python 3.12)

1. Activate virtual environment:
   ```powershell
   cd C:\Users\Dell\source\repos\SMS\AI-Platform
   .\.venv\Scripts\Activate.ps1
   ```
2. Configure `AI-Platform/.env` (untracked in Git; copy from `.env.example`):
   - Keep `LLM_PROVIDER=mock` for offline deterministic evaluation, OR set:
     ```env
     LLM_PROVIDER=gemini
     GEMINI_API_KEY=<your-gemini-api-key>
     GEMINI_MODEL_FAST=gemini-2.5-flash-lite
     GEMINI_MODEL_REASONING=gemini-2.5-flash
     ```
   - Ensure `AI_CONTEXT_HMAC_SECRET` matches `Backend/appsettings.json -> AiPlatform:HmacSecret`.
3. Start AI-Platform API:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8100 --reload
   ```
4. Run Full Verification Suite:
   ```powershell
   pytest app/tests/ -v
   ```

## Architecture Layout

```text
AI-Platform/
  app/
    main.py                 # FastAPI app + OpenTelemetry + trace middleware
    config/                 # Pydantic Settings (.env)
    api/                    # /health, /ready, /metrics, /api/v1/ai/* chat/stream/documents
    core/                   # Domain exceptions + JSON trace logging
    security/               # HMAC context verifier, RBAC normalization, pending action store
    llm/                    # BaseProvider, Gemini, OpenAI-compatible, Mock, fallback ModelRouter
    planners/               # Structured planning, assessment, follow-up synthesis
    orchestration/          # LangGraph stateful multi-step investigation loop
    agents/                 # AutonomousErpAgent facade
    integrations/           # MySqlReadOnlyReader & HMAC-signed ErpBridgeClient
    tools/                  # 17 ERP modules + analytics + ML + RAG + two-phase actions
    analytics/              # Decimal-safe Pandas/NumPy engines & reconciliation verifier
    ml/                     # Data-sufficiency auditor + IsolationForest + gated forecasting
    rag/                    # Embeddings + role-ACL vector store + PDF/DOCX/TXT/circular ingestor
    memory/                 # User/tenant-scoped memory manager (Redis + SQLite)
    repositories/           # SQLite conversation/message repository
    workers/                # Optional Celery circular-sync worker
    evaluation/             # 10-scenario enterprise benchmark harness
    monitoring/             # Metrics + OpenTelemetry setup
    tests/                  # Automated tests covering Stages 3-11
```
