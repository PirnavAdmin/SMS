# PowerShell script to execute Frontend TypeScript Type-checking & Build
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running Frontend Build & Type Validation " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "..\..\Frontend\school-management-system"

if (-not (Test-Path $frontendDir)) {
    Write-Error "Frontend directory not found at: $frontendDir"
    exit 1
}

Push-Location $frontendDir

try {
    Write-Host "Running TypeScript compilation (tsc -b)..." -ForegroundColor Yellow
    npx tsc -b
    $tscExit = $LASTEXITCODE

    if ($tscExit -ne 0) {
        Write-Host "[FAILURE] TypeScript compilation failed!" -ForegroundColor Red
        exit $tscExit
    }

    Write-Host "Running Production Build (vite build)..." -ForegroundColor Yellow
    npm run build
    $buildExit = $LASTEXITCODE

    if ($buildExit -eq 0) {
        Write-Host "[SUCCESS] Frontend Build & Typechecks PASSED!" -ForegroundColor Green
    } else {
        Write-Host "[FAILURE] Frontend build failed!" -ForegroundColor Red
    }

    exit $buildExit
} finally {
    Pop-Location
}
