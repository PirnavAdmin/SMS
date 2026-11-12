# School Management System — QA Automation Suite

Comprehensive Playwright + API + Data-Driven + Performance testing suite under `automation/`.

## Structure

- `tests/smoke/` — Fast build-stability checks (`@smoke`): landing/login, RBAC sidebar routing, core module rendering, API health.
- `tests/e2e/` — Full UI-to-backend journeys (`@e2e`, `@regression`) using Page Object Model (`pages/`).
- `tests/data-driven/` — Parameterized CSV & JSON tests (`@ddt`, `@regression`) using `data/`.
- `tests/api/` — Live REST API contract, schema, JWT/RBAC middleware, and DB persistence tests (`@api`).
- `performance/` — `login-and-core-k6.js` (k6) and `load-runner.mjs` (built-in Node.js concurrent load runner).
- `pages/` — Page Object Model classes (`BasePage`, `LoginPage`, `DashboardPage`, `AdmissionsPage`, `StudentsPage`, `AcademicsPage`, `FinancePage`, `StaffPage`, `OperationsPage`, `AdminSettingsPage`).
- `data/` — Generators, API seeder/cleanup registry (`seed-and-cleanup.ts`), and external datasets (`login-cases.csv`, `form-validation-cases.json`, `fee-calculations.json`, `rbac-matrix.json`).

## Setup

1. Copy `.env.test.example` to `.env.test` inside `automation/` (git-ignored) and set `ADMIN_EMAIL` / `ADMIN_PASSWORD` (and any optional role accounts).
2. Ensure Backend (`http://localhost:5151`) and Frontend (`http://localhost:5173`) are running.

## Commands (run from `automation/`)

- `npm run test:smoke` — Fast smoke suite (`@smoke`)
- `npm run test:e2e` — End-to-end journeys (`@e2e`)
- `npm run test:regression` — Tagged modular regression (`@regression`)
- `npm run test:ddt` — Data-driven CSV/JSON suite (`@ddt`)
- `npm run test:api` — API contract & RBAC suite (`@api`)
- `npm run test:all` — All Playwright suites
- `npm run test:backend` — .NET xUnit tests (`Backend.Tests`)
- `npm run test:frontend:build` — Frontend TypeScript + Vite build check
- `npm run test:perf` — Concurrent Node load test (outputs `reports/perf-report.html`)
- `npm run test:perf:k6` — Run k6 load script (requires `k6` installed)
- `npm run test:report` — Open Playwright HTML report (`reports/playwright-report/index.html`)
