# PowerShell script to execute ASP.NET Core Backend Unit & Integration Tests
param (
    [string]$Configuration = "Debug"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running ASP.NET Core Backend Tests... " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$testProject = Join-Path $PSScriptRoot "..\..\Backend.Tests\Backend.Tests.csproj"

if (-not (Test-Path $testProject)) {
    Write-Error "Backend test project not found at: $testProject"
    exit 1
}

dotnet test $testProject --configuration $Configuration --logger "console;verbosity=normal"
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "[SUCCESS] All Backend Tests PASSED Cleanly!" -ForegroundColor Green
} else {
    Write-Host "[FAILURE] Backend Tests Failed with exit code $exitCode" -ForegroundColor Red
}

exit $exitCode
