#!/usr/bin/env pwsh
<#
.SYNOPSIS
    NovaStock Production Deployment Script
    Builds frontend, kills stale processes, and starts all services in production mode.
#>

$ErrorActionPreference = "Continue"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Join-Path $rootDir "inventory-management-system"

# Use project dir if we're already in inventory-management-system
if (Test-Path (Join-Path $rootDir "frontend")) {
    $projectDir = $rootDir
}

$frontendDir = Join-Path $projectDir "frontend"
$backendDir = Join-Path $projectDir "backend"
$adminDir = Join-Path $backendDir "admin-service"
$gatewayDir = Join-Path $backendDir "api-gateway"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   NovaStock — Production Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Kill existing processes on ports 5000 and 5001 ──
Write-Host "[1/6] Killing existing processes on ports 5000 & 5001..." -ForegroundColor Yellow

$ports = @(5000, 5001)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  Killed process $pid on port $port" -ForegroundColor Gray
            } catch {
                Write-Host "  Could not kill process $pid on port $port" -ForegroundColor Gray
            }
        }
    }
}
Start-Sleep -Seconds 2
Write-Host "  Done." -ForegroundColor Green

# ── Step 2: Build Frontend ──
Write-Host ""
Write-Host "[2/6] Building frontend for production..." -ForegroundColor Yellow
Push-Location $frontendDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  Frontend built successfully." -ForegroundColor Green

# ── Step 3: Verify dist exists ──
Write-Host ""
Write-Host "[3/6] Verifying frontend build output..." -ForegroundColor Yellow
$distPath = Join-Path $frontendDir "dist"
if (Test-Path (Join-Path $distPath "index.html")) {
    $fileCount = (Get-ChildItem -Path $distPath -Recurse -File).Count
    Write-Host "  dist/index.html found. Total files: $fileCount" -ForegroundColor Green
} else {
    Write-Error "dist/index.html not found! Build may have failed."
    exit 1
}

# ── Step 4: Start Admin Service ──
Write-Host ""
Write-Host "[4/6] Starting Admin Service (port 5001)..." -ForegroundColor Yellow
$adminProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $adminDir -PassThru -WindowStyle Minimized
Write-Host "  Admin Service starting (PID: $($adminProcess.Id))..." -ForegroundColor Green

# Wait for admin service to be ready
Write-Host "  Waiting for Admin Service to connect to MongoDB..." -ForegroundColor Gray
$retries = 0
$maxRetries = 30
$adminReady = $false
while ($retries -lt $maxRetries) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.status -eq "ok") {
            $adminReady = $true
            break
        }
    } catch {}
    $retries++
}

if ($adminReady) {
    Write-Host "  Admin Service is ready!" -ForegroundColor Green
} else {
    Write-Host "  Warning: Admin Service health check not responding after ${maxRetries}s. It may still be starting." -ForegroundColor Yellow
}

# ── Step 5: Start API Gateway ──
Write-Host ""
Write-Host "[5/6] Starting API Gateway (port 5000)..." -ForegroundColor Yellow
$gatewayProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $gatewayDir -PassThru -WindowStyle Minimized
Write-Host "  API Gateway starting (PID: $($gatewayProcess.Id))..." -ForegroundColor Green

# Wait for gateway to be ready
Start-Sleep -Seconds 3
$retries = 0
$gatewayReady = $false
while ($retries -lt 15) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $gatewayReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
    $retries++
}

if ($gatewayReady) {
    Write-Host "  API Gateway is ready!" -ForegroundColor Green
} else {
    Write-Host "  Warning: API Gateway not responding yet. It may still be starting." -ForegroundColor Yellow
}

# ── Step 6: Health Check & Summary ──
Write-Host ""
Write-Host "[6/6] Running health checks..." -ForegroundColor Yellow

# Admin Service Health
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5001/health" -TimeoutSec 5
    Write-Host "  Admin Service: OK (uptime: $([math]::Round($health.uptime, 1))s)" -ForegroundColor Green
} catch {
    Write-Host "  Admin Service: UNREACHABLE" -ForegroundColor Red
}

# API Gateway + Frontend
try {
    $page = Invoke-WebRequest -Uri "http://localhost:5000/" -TimeoutSec 5
    if ($page.Content -match "NovaStock") {
        Write-Host "  API Gateway + Frontend: OK (serving NovaStock)" -ForegroundColor Green
    } else {
        Write-Host "  API Gateway: OK (response received)" -ForegroundColor Green
    }
} catch {
    Write-Host "  API Gateway: UNREACHABLE" -ForegroundColor Red
}

# API Proxy Check
try {
    $apiHealth = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5
    Write-Host "  API Proxy (gateway -> admin): OK" -ForegroundColor Green
} catch {
    Write-Host "  API Proxy: UNREACHABLE" -ForegroundColor Red
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   NovaStock Production Deployment Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host @"

  Application URL:  http://localhost:5000
  Admin Service:    http://localhost:5001
  Health Check:     http://localhost:5001/health
  MongoDB:          localhost:27017

  Default Admin Login:
    Email:    admin@inventory.com
    Password: Admin@123!

  To stop all services:
    Get-Process -Name node | Stop-Process -Force

  To restart:
    .\start-production.ps1

"@ -ForegroundColor White
