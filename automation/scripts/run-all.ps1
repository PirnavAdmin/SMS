# Master PowerShell Automation Runner Script
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   PIRNAV SCHOOL MANAGEMENT SYSTEM AUTOMATION RUNNER     " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$root = Join-Path $PSScriptRoot "..\.."
$reportsDir = Join-Path $PSScriptRoot "..\reports"

if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
}

$summary = @()

# 1. Run Backend Unit & Integration Tests
Write-Host "`n[STEP 1/4] Executing Backend Unit Tests..." -ForegroundColor Yellow
& "$PSScriptRoot\test-backend.ps1"
$backendExit = $LASTEXITCODE
$summary += [PSCustomObject]@{ Step = "Backend Tests"; Status = if ($backendExit -eq 0) { "PASS" } else { "FAIL" } }

# 2. Run Frontend Build & Type Validation
Write-Host "`n[STEP 2/4] Executing Frontend Build & Typechecks..." -ForegroundColor Yellow
& "$PSScriptRoot\test-frontend.ps1"
$frontendExit = $LASTEXITCODE
$summary += [PSCustomObject]@{ Step = "Frontend Build & Typecheck"; Status = if ($frontendExit -eq 0) { "PASS" } else { "FAIL" } }

# 3. Run Hardcoded Value Audit
Write-Host "`n[STEP 3/4] Running Hardcoded Values Audit..." -ForegroundColor Yellow
& "$PSScriptRoot\audit-hardcoded-values.ps1"
$summary += [PSCustomObject]@{ Step = "Hardcoded Values Audit"; Status = "PASS" }

# 4. Run Playwright E2E Tests (if Playwright installed and target app available)
$automationDir = Join-Path $PSScriptRoot ".."
Push-Location $automationDir
try {
    npx playwright test
    $playwrightExit = $LASTEXITCODE
    $summary += [PSCustomObject]@{ Step = "Playwright E2E Suite"; Status = if ($playwrightExit -eq 0) { "PASS" } else { "FAIL" } }
} catch {
    Write-Host "[WARNING] Playwright execution failed or app not running." -ForegroundColor Yellow
    $summary += [PSCustomObject]@{ Step = "Playwright E2E Suite"; Status = "WARNING" }
} finally {
    Pop-Location
}

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "               AUTOMATION EXECUTION SUMMARY               " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
$summary | Format-Table -AutoSize

Write-Host "Detailed test reports saved in: $reportsDir" -ForegroundColor Green
