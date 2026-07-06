$base = "c:\Users\anbuk\OneDrive\Desktop\inventory management system microservices-1\inventory-management-system\backend"
$services = @(
  "auth-service",
  "product-service",
  "inventory-service",
  "supplier-service",
  "customer-service",
  "purchase-service",
  "sales-service",
  "api-gateway"
)

foreach ($svc in $services) {
  $svcPath = Join-Path $base $svc
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$svcPath'; npm run dev" -WindowStyle Normal
}

Write-Host "Started all microservices in separate windows." -ForegroundColor Green
