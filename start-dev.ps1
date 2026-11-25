<#
.SYNOPSIS
    Starts Pirnav SMS AI-Platform (:8100), ASP.NET Core Backend (:5151), and Vite Frontend (:5173)
    in the proper readiness order so Vite never throws ECONNREFUSED on cold startup.
#>

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-TcpPort {
    param([string]$HostName = "127.0.0.1", [int]$Port)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect($HostName, $Port, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne(400)
        if ($ok -and $client.Connected) {
            $client.EndConnect($async)
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    } catch {
        return $false
    }
}

Write-Host "=== Pirnav SMS Autonomous AI Stack Launcher ===" -ForegroundColor Cyan

# 1. Python AI-Platform (:8100)
if (-not (Test-TcpPort -Port 8100)) {
    Write-Host "[1/3] Starting Python AI-Platform on http://127.0.0.1:8100 ..." -ForegroundColor Yellow
    Start-Process -FilePath "$RepoRoot\AI-Platform\.venv\Scripts\uvicorn.exe" `
        -ArgumentList "app.main:app", "--host", "127.0.0.1", "--port", "8100" `
        -WorkingDirectory "$RepoRoot\AI-Platform"
    for ($i = 0; $i -lt 30; $i++) {
        if (Test-TcpPort -Port 8100) { break }
        Start-Sleep -Seconds 1
    }
}
Write-Host "[1/3] Python AI-Platform ready on :8100." -ForegroundColor Green

# 2. ASP.NET Core Backend (:5151)
if (-not (Test-TcpPort -Port 5151)) {
    Write-Host "[2/3] Starting ASP.NET Core Backend on http://localhost:5151 (building first)..." -ForegroundColor Yellow
    Start-Process -FilePath "dotnet" `
        -ArgumentList "run" `
        -WorkingDirectory "$RepoRoot\Backend"
    for ($i = 0; $i -lt 120; $i++) {
        if ((Test-TcpPort -HostName "127.0.0.1" -Port 5151) -or (Test-TcpPort -HostName "::1" -Port 5151)) { break }
        Start-Sleep -Seconds 1
    }
}
Write-Host "[2/3] ASP.NET Core Backend ready on :5151." -ForegroundColor Green

# 3. Vite Frontend (:5173)
if (-not (Test-TcpPort -HostName "::1" -Port 5173) -and -not (Test-TcpPort -HostName "127.0.0.1" -Port 5173)) {
    Write-Host "[3/3] Starting React Vite Dev Server on http://localhost:5173 ..." -ForegroundColor Yellow
    Set-Location "$RepoRoot\Frontend\school-management-system"
    node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js
} else {
    Write-Host "[3/3] React Vite Dev Server is already running on http://localhost:5173." -ForegroundColor Green
}
