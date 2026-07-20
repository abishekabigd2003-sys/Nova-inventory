$ErrorActionPreference = "Stop"

if (-not $env:MONGO_URI) {
    Write-Error "MONGO_URI environment variable is required. Please set it to your MongoDB Atlas connection string before running tests."
    exit 1
}
$env:JWT_SECRET = "supersecrettestkey"
$env:ADMIN_SERVICE_URL = "http://127.0.0.1:5001"
$env:API_GATEWAY_URL = "http://127.0.0.1:5000"
$env:FRONTEND_URL = "http://127.0.0.1:5000"

Write-Host "Starting Admin Service..."
Start-Process node -ArgumentList "backend/admin-service/src/server.js" -NoNewWindow -RedirectStandardOutput admin.log -RedirectStandardError admin.err
npx wait-on -i 1000 -t 30000 http://127.0.0.1:5001/health
Write-Host "Admin Service Started"

Write-Host "Starting API Gateway..."
Start-Process node -ArgumentList "backend/api-gateway/src/server.js" -NoNewWindow -RedirectStandardOutput api.log -RedirectStandardError api.err
npx wait-on -i 1000 -t 30000 http://127.0.0.1:5000/health
Write-Host "API Gateway Started"

Write-Host "Frontend is served by API Gateway on port 5000"

Write-Host "Running QA Tests..."
Set-Location qa-tests
npm run seed
npm test

Write-Host "Cleaning up..."
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
