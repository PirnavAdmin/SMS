# PowerShell script to package clean source code excluding build artifacts, git history, and node modules

$sourceDir = "c:\Users\ADMIN\source\repos\SMS"
$outputZip = "c:\Users\ADMIN\source\repos\SMS_Clean_Source.zip"

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

$excludePatterns = @(
    "*\.git\*",
    "*\.git",
    "*\node_modules\*",
    "*\node_modules",
    "*\bin\*",
    "*\bin",
    "*\obj\*",
    "*\obj",
    "*\dist\*",
    "*\dist",
    "*\.gemini\*",
    "*\.gemini",
    "*\Frontend.zip",
    "*\*.user",
    "*\.vs\*",
    "*\.vs"
)

Write-Host "Creating clean source ZIP archive at $outputZip..."

$files = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length)
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
}

Compress-Archive -Path $files.FullName -DestinationPath $outputZip -Force

Write-Host "Clean source package created successfully! Size: $((Get-Item $outputZip).Length / 1MB) MB"
