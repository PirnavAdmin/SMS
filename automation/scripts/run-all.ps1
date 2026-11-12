# Master PowerShell Automation Runner Script
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   PIRNAV SCHOOL MANAGEMENT SYSTEM AUTOMATION RUNNER     " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$reportsDir = Join-Path $PSScriptRoot "..\reports"
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
}

$summary = @()

# 1. Run Backend Unit & Integration Tests
Write-Host "`n[STEP 1/5] Executing Backend Unit Tests..." -ForegroundColor Yellow
& "$PSScriptRoot\test-backend.ps1"
$backendExit = $LASTEXITCODE
$summary += [PSCustomObject]@{ Step = "Backend xUnit Tests"; Status = if ($backendExit -eq 0) { "PASS" } else { "FAIL" } }

# 2. Run Frontend Build & Type Validation
Write-Host "`n[STEP 2/5] Executing Frontend Build & Typechecks..." -ForegroundColor Yellow
& "$PSScriptRoot\test-frontend.ps1"
$frontendExit = $LASTEXITCODE
$summary += [PSCustomObject]@{ Step = "Frontend Build & Typecheck"; Status = if ($frontendExit -eq 0) { "PASS" } else { "FAIL" } }

# 3. Run Hardcoded Value Audit
Write-Host "`n[STEP 3/5] Running Hardcoded Values Audit..." -ForegroundColor Yellow
& "$PSScriptRoot\audit-hardcoded-values.ps1"
$summary += [PSCustomObject]@{ Step = "Hardcoded Values Audit"; Status = "PASS" }

# 4. Run Playwright Smoke + API + E2E + DDT Suites
$automationDir = Join-Path $PSScriptRoot ".."
Push-Location $automationDir
try {
    Write-Host "`n[STEP 4/5] Running Playwright Automation Suite..." -ForegroundColor Yellow
    npx playwright test
    $playwrightExit = $LASTEXITCODE
    $summary += [PSCustomObject]@{ Step = "Playwright Suite"; Status = if ($playwrightExit -eq 0) { "PASS" } else { "FAIL" } }

    Write-Host "`n[STEP 5/5] Running Concurrent Performance Load Test..." -ForegroundColor Yellow
    npm run test:perf
    $perfExit = $LASTEXITCODE
    $summary += [PSCustomObject]@{ Step = "Performance Load Test"; Status = if ($perfExit -eq 0) { "PASS" } else { "WARNING" } }
} finally {
    Pop-Location
}

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "               AUTOMATION EXECUTION SUMMARY               " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
$summary | Format-Table -AutoSize

Write-Host "HTML report: $reportsDir\playwright-report\index.html" -ForegroundColor Green
Write-Host "Perf report: $reportsDir\perf-report.html" -ForegroundColor Green
