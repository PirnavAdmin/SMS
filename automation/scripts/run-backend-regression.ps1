[CmdletBinding()]
param (
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Debug",

    [string]$Filter
)

$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$testProject = Join-Path $repositoryRoot "Backend.Tests\Backend.Tests.csproj"
$resultsDirectory = Join-Path $PSScriptRoot "..\reports\backend-tests"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Error "The .NET SDK is required to run backend regression tests."
    exit 1
}

if (-not (Test-Path $testProject)) {
    Write-Error "Backend test project not found at: $testProject"
    exit 1
}

New-Item -ItemType Directory -Path $resultsDirectory -Force | Out-Null

$arguments = @(
    "test",
    $testProject,
    "--configuration",
    $Configuration,
    "--logger",
    "trx;LogFileName=backend-tests.trx",
    "--results-directory",
    $resultsDirectory
)

if (-not [string]::IsNullOrWhiteSpace($Filter)) {
    $arguments += @("--filter", $Filter)
}

& dotnet @arguments
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "[PASS] Backend regression tests passed." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend regression tests failed with exit code $exitCode." -ForegroundColor Red
}

Write-Host "Test results: $resultsDirectory"
exit $exitCode
