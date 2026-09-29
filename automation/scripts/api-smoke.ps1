# PowerShell script to test backend API endpoints for status codes and responsiveness
param (
    [string]$ApiBaseUrl = "http://localhost:5151"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running REST API Smoke Checks...        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$endpoints = @(
    "/api/auth/roles",
    "/api/settings/academic-years",
    "/api/academic/classes",
    "/api/students",
    "/api/staff",
    "/api/finance/schedules"
)

$passed = 0
$failed = 0

foreach ($ep in $endpoints) {
    $url = "$ApiBaseUrl$ep"
    try {
        $res = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($res.StatusCode -lt 500) {
            Write-Host "[PASS] GET $ep -> Status $($res.StatusCode)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "[FAIL] GET $ep -> Status $($res.StatusCode)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "[BLOCKED/FAIL] GET $ep -> Cannot connect or endpoint error ($($_.Exception.Message))" -ForegroundColor Yellow
        $failed++
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "API Smoke Results: $passed Passed, $failed Failed/Offline" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })

exit ($failed -gt 0 ? 1 : 0)
