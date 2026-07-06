#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Starts the IMS Microservices stack using Docker.
    Compatible with both Docker Desktop v2 (docker compose) and legacy Docker v1 (docker-compose).
#>

$backendPath = Join-Path $PSScriptRoot "inventory-management-system\backend"

Write-Host "`n===========================================`n  Inventory Management System Startup`n===========================================" -ForegroundColor Cyan

# Verify Docker is running
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

Write-Host "`n[INFO] Docker is running." -ForegroundColor Green

# Detect docker compose vs docker-compose
$useDockerComposeV2 = $false
try {
    docker compose version > $null 2>&1
    if ($LASTEXITCODE -eq 0) { $useDockerComposeV2 = $true }
} catch {}

if ($useDockerComposeV2) {
    Write-Host "[INFO] Using Docker Compose V2 (docker compose)" -ForegroundColor Green
} else {
    Write-Host "[INFO] Using Docker Compose V1 (docker-compose)" -ForegroundColor Yellow
}

# Navigate to backend
Set-Location $backendPath

# Start services
Write-Host "`n[INFO] Building and starting all microservices..." -ForegroundColor Cyan

if ($useDockerComposeV2) {
    docker compose up --build -d
} else {
    docker-compose up --build -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker failed to start. Check the output above for errors."
    exit 1
}

Write-Host "`n[SUCCESS] All services started!" -ForegroundColor Green
Write-Host @"

  Services Running:
    API Gateway     -> http://localhost:5000
    Auth Service    -> http://localhost:5001
    Product Service -> http://localhost:5002
    Inventory Svc   -> http://localhost:5003
    Supplier Svc    -> http://localhost:5004
    Customer Svc    -> http://localhost:5005
    Purchase Svc    -> http://localhost:5006
    Sales Svc       -> http://localhost:5007
    MongoDB         -> localhost:27017

  Frontend:
    Run 'cd inventory-management-system/frontend && npm install && npm run dev'
    Then open http://localhost:5173

"@ -ForegroundColor White
