$ErrorActionPreference = 'Stop'

Write-Host 'Testing Login...'
$LoginBody = @{ email = 'admin@inventory.com'; password = 'admin123' }
$LoginJson = $LoginBody | ConvertTo-Json
$LoginRes = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $LoginJson -ContentType 'application/json'
$Token = $LoginRes.token

$Headers = @{ Authorization = "Bearer $Token" }

Write-Host 'Testing Category Creation...'
$Rand = Get-Random -Maximum 99999
$CatBody = @{ name = "Test Category $Rand"; description = 'A test category' }
$CatRes = Invoke-RestMethod -Uri 'http://localhost:5000/api/categories' -Method Post -Body ($CatBody | ConvertTo-Json) -ContentType 'application/json' -Headers $Headers
$CatId = $CatRes._id

Write-Host 'Testing Product Creation...'
$ProdBody = @{ name = "Test Product $Rand"; sku = "TST-$Rand"; categoryId = $CatId; price = 100; description = 'A test product' }
$ProdRes = Invoke-RestMethod -Uri 'http://localhost:5000/api/products' -Method Post -Body ($ProdBody | ConvertTo-Json) -ContentType 'application/json' -Headers $Headers
$ProdId = $ProdRes._id

Write-Host 'Testing Stock In...'
$StockBody = @{ type = 'IN'; productId = $ProdId; itemType = 'Finished Product'; quantity = 50; date = (Get-Date).ToString('yyyy-MM-dd') }
$StockRes = Invoke-RestMethod -Uri 'http://localhost:5000/api/stock' -Method Post -Body ($StockBody | ConvertTo-Json) -ContentType 'application/json' -Headers $Headers

Write-Host 'Verifying Inventory Calculation...'
$ProdCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/products/$ProdId" -Method Get -Headers $Headers
if ($ProdCheck.inventoryCount -eq 50) {
    Write-Host 'Inventory Calculation OK!'
} else {
    Write-Host 'Inventory Calculation FAILED!'
}

Write-Host 'Testing Stock Out...'
$StockOutBody = @{ productId = $ProdId; itemType = 'Finished Product'; quantity = 20; date = (Get-Date).ToString('yyyy-MM-dd') }
$StockOutRes = Invoke-RestMethod -Uri 'http://localhost:5000/api/stock-out' -Method Post -Body ($StockOutBody | ConvertTo-Json) -ContentType 'application/json' -Headers $Headers

Write-Host 'Verifying Inventory Calculation after Stock Out...'
$ProdCheck2 = Invoke-RestMethod -Uri "http://localhost:5000/api/products/$ProdId" -Method Get -Headers $Headers
if ($ProdCheck2.inventoryCount -eq 30) {
    Write-Host 'Inventory Calculation OK!'
} else {
    Write-Host 'Inventory Calculation FAILED!'
}

Write-Host 'E2E Test Completed Successfully.'
