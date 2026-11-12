# PowerShell script to test backend API endpoints for status codes and responsiveness
param (
    [string]$ApiBaseUrl = "http://localhost:5151"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running REST API Smoke Checks...        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$publicEndpoints = @(
    "/api/Settings/public-branding",
    "/api/superadmin/setup-status"
)

$protectedEndpoints = @(
    "/api/academic-years",
    "/api/classes",
    "/api/v1/students",
    "/api/staff",
    "/api/finance/fee-heads",
    "/api/dashboard/summary"
)

$passed = 0
$failed = 0

foreach ($ep in $publicEndpoints) {
    $url = "$ApiBaseUrl$ep"
    try {
        $res = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            Write-Host "[PASS] GET $ep -> Status $($res.StatusCode)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "[FAIL] GET $ep -> Status $($res.StatusCode)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "[FAIL] GET $ep -> $($_.Exception.Message)" -ForegroundColor Yellow
        $failed++
    }
}

foreach ($ep in $protectedEndpoints) {
    $url = "$ApiBaseUrl$ep"
    try {
        $res = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[WARN] GET $ep -> Expected 401 without token, got $($res.StatusCode)" -ForegroundColor Yellow
        $failed++
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "[PASS] GET $ep -> Auth guard returned 401 as expected" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "[FAIL] GET $ep -> $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "API Smoke Results: $passed Passed, $failed Failed/Offline" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })

exit ($(if ($failed -gt 0) { 1 } else { 0 }))
