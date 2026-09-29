# PowerShell script to audit hardcoded business values across Frontend & Backend code
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Hardcoded Values & Configuration Audit   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$root = Join-Path $PSScriptRoot "..\.."
$reportPath = Join-Path $PSScriptRoot "..\reports\hardcoded-values-audit-report.md"

$results = @()

# Suspicious patterns to scan
$patterns = @(
    @{ Name = "Hardcoded Academic Year String"; Pattern = '"2026-2027"' },
    @{ Name = "Hardcoded Standard Date"; Pattern = '"2026-04-01"' },
    @{ Name = "Hardcoded Due Date"; Pattern = '"2026-04-15"' },
    @{ Name = "Hardcoded Fee Amount"; Pattern = 'TotalAmount\s*=\s*\d{4,}' },
    @{ Name = "Hardcoded API Base URL"; Pattern = 'http://localhost:\d{4}' }
)

$targetFiles = Get-ChildItem -Path "$root\Frontend\school-management-system\src", "$root\Backend" -Recurse -Include "*.ts", "*.tsx", "*.cs" | Where-Object { $_.FullName -notmatch '\\obj\\' -and $_.FullName -notmatch '\\bin\\' -and $_.FullName -notmatch 'node_modules' }

foreach ($file in $targetFiles) {
    $lines = Get-Content -Path $file.FullName
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        foreach ($p in $patterns) {
            if ($line -match $p.Pattern) {
                $relativePath = $file.FullName.Replace($root, "")
                $results += [PSCustomObject]@{
                    File = $relativePath
                    LineNumber = $i + 1
                    Category = $p.Name
                    Content = $line.Trim()
                }
            }
        }
    }
}

# Generate Markdown Audit Report
$reportHeader = @"
# Hardcoded Values & Configuration Audit Report

Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Total Suspicious Occurrences Found: $($results.Count)

| File Path | Line | Category | Suspicious Snippet | Recommended Action |
|-----------|------|----------|--------------------|--------------------|
"@

$reportRows = $results | ForEach-Object {
    "| `$($_.File)` | `$($_.LineNumber)` | `$($_.Category)` | ``$($_.Content.Replace('|', '\|'))`` | Make configurable via DB/Settings |"
}

$finalReport = $reportHeader + "`n" + ($reportRows -join "`n")

$parentDir = Split-Path $reportPath -Parent
if (-not (Test-Path $parentDir)) {
    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
}
Set-Content -Path $reportPath -Value $finalReport

Write-Host "Audit completed! Report generated at: $reportPath" -ForegroundColor Green
Write-Host "Found $($results.Count) hardcoded instances requiring configuration review." -ForegroundColor Yellow

