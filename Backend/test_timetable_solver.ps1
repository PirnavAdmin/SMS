$loginUrl = "http://localhost:5151/api/auth/login"
$generateUrl = "http://localhost:5151/api/academics/timetable/generate"
$validateUrl = "http://localhost:5151/api/academics/timetable/validate?classId=1&sectionId=1&academicYear=2026-2027"

# 1. Login as Admin
$payload = @{
    emailOrPhone = "admin@pirnavschools.com"
    password = "admin1234"
}
$bodyJson = $payload | ConvertTo-Json -Compress
$tempFile = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tempFile, $bodyJson)

$loginResponse = curl.exe -s -X POST -H "Content-Type: application/json" -d "@$tempFile" $loginUrl
Remove-Item $tempFile -Force

$jsonObj = $loginResponse | ConvertFrom-Json
$token = $jsonObj.token

Write-Output "Admin Token obtained successfully!"
Write-Output "========================================"

# 2. Call POST /api/academics/timetable/generate
$generatePayload = @{
    schoolStartTime = "08:30 AM"
    schoolEndTime = "03:30 PM"
    periodDurationMinutes = 45
    breaks = @(
        @{ name = "Morning Break"; durationMinutes = 15; afterPeriod = 2; type = "Break" },
        @{ name = "Lunch Break"; durationMinutes = 45; afterPeriod = 4; type = "Lunch" }
    )
    workingDays = @("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
    selectedClassSections = @("Class 9-A")
    academicYear = "2026-2027"
}
$genJson = $generatePayload | ConvertTo-Json -Depth 5 -Compress
$tempFile2 = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tempFile2, $genJson)

Write-Output "Sending POST /api/academics/timetable/generate..."
$genResponse = curl.exe -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $token" -H "X-Branch-Id: Main Campus" -H "X-Academic-Year-Id: 2026-2027" -d "@$tempFile2" $generateUrl
Remove-Item $tempFile2 -Force
Write-Output "Generation Response:"
Write-Output $genResponse
Write-Output "========================================"

# 3. Call POST /api/academics/timetable/validate
Write-Output "Sending POST /api/academics/timetable/validate..."
$valResponse = curl.exe -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $token" -H "X-Branch-Id: Main Campus" -H "X-Academic-Year-Id: 2026-2027" $validateUrl
Write-Output "Validation Response:"
Write-Output $valResponse
Write-Output "========================================"
