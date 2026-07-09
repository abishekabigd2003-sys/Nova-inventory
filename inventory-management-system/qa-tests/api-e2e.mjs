

const BASE_URL = 'http://localhost:5001/api';

const config = {
  adminToken: null,
  userToken: null,
  categoryId: null,
  productId: null,
  stockInId: null,
  stockOutId: null,
};

// Helper for assertions
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- STARTING QA API TESTS ---\n');

  try {
    // 1. AUTHENTICATION TESTS
    console.log('[1] Testing Authentication...');
    
    // Admin Login
    const adminRes = await apiRequest('/auth/login', 'POST', {
      email: 'admin@inventory.com',
      password: 'Admin@123!'
    });
    assert(adminRes.ok, `Admin login failed: ${JSON.stringify(adminRes.data)}`);
    config.adminToken = adminRes.data.token;
    assert(config.adminToken, 'Admin token missing');
    console.log('✅ Admin Authentication passed');

    // Invalid Login
    const invalidRes = await apiRequest('/auth/login', 'POST', {
      email: 'admin@inventory.com',
      password: 'wrongpassword'
    });
    assert(invalidRes.status === 401, 'Invalid login should return 401');
    console.log('✅ Invalid Login check passed');

    // 2. CATEGORY TESTS
    console.log('\n[2] Testing Categories...');
    const catName = `QA Category ${Date.now()}`;
    const createCatRes = await apiRequest('/categories', 'POST', {
      name: catName,
      description: 'Test category for QA'
    }, config.adminToken);
    
    assert(createCatRes.ok, `Category creation failed: ${JSON.stringify(createCatRes.data)}`);
    config.categoryId = createCatRes.data._id;
    console.log('✅ Category created:', config.categoryId);

    // 3. PRODUCT TESTS
    console.log('\n[3] Testing Products...');
    const sku = `SKU-QA-${Date.now()}`;
    const createProdRes = await apiRequest('/products', 'POST', {
      name: 'QA Test Product',
      sku: sku,
      categoryId: config.categoryId,
      price: 150.50,
      minStockLevel: 10
    }, config.adminToken);

    assert(createProdRes.ok, `Product creation failed: ${JSON.stringify(createProdRes.data)}`);
    config.productId = createProdRes.data._id;
    assert(createProdRes.data.inventoryCount === 0, 'New product should have 0 inventory');
    console.log('✅ Product created:', config.productId);

    // 4. STOCK IN TESTS
    console.log('\n[4] Testing Stock In (Inventory Increment)...');
    const stockInRes = await apiRequest('/stockin', 'POST', {
      poDate: new Date().toISOString(),
      poNumber: 'PO-QA-100',
      partyName: 'QA Supplier',
      yarnCount: '40s QA',
      itemName: 'QA Cotton',
      color: 'White',
      baleCount: 10,
      weight: 500,
      status: 'Approved' // Simulating approval immediately
    }, config.adminToken);

    assert(stockInRes.ok, `Stock In failed: ${JSON.stringify(stockInRes.data)}`);
    config.stockInId = stockInRes.data._id;
    console.log('✅ Stock In created');

    // Let's manually increment Product inventory if StockIn doesn't do it automatically
    // Wait, let's check if StockIn automatically updates Product inventory.
    // In our models, StockIn doesn't have a productId. It's raw material.
    // StockOut uses ProductId.
    // Let's create a legacy 'IN' Stock if needed, but Stock Out API tests product counts.
    
    // Let's add inventory directly via product update to test Stock Out
    console.log('\n[5] Adding Inventory for Stock Out test...');
    const addStockRes = await apiRequest(`/products/${config.productId}`, 'PUT', {
      inventoryCount: 100,
      totalWeight: 5000,
      totalBales: 50
    }, config.adminToken);
    assert(addStockRes.ok, 'Failed to update product inventory');

    // 6. STOCK OUT TESTS
    console.log('\n[6] Testing Stock Out (Inventory Decrement)...');
    const stockOutRes = await apiRequest('/stock-out', 'POST', {
      productId: config.productId,
      itemType: 'Finished Goods',
      quantity: 15,
      weight: 150,
      bale: 5,
      customerName: 'QA Customer',
      invoiceNumber: 'INV-QA-200'
    }, config.adminToken);

    assert(stockOutRes.ok, `Stock Out failed: ${JSON.stringify(stockOutRes.data)}`);
    console.log('✅ Stock Out created');

    // Verify Product inventory decrement
    const prodCheckRes = await apiRequest(`/products/${config.productId}`, 'GET', null, config.adminToken);
    const prodCheck = prodCheckRes.data;
    assert(prodCheck.inventoryCount === 85, `Inventory count wrong. Expected 85, got ${prodCheck.inventoryCount}`);
    console.log('✅ Inventory decremented correctly (100 - 15 = 85)');

    // 7. STOCK OUT VALIDATION (Insufficient Stock)
    console.log('\n[7] Testing Insufficient Stock Validation...');
    const failStockOutRes = await apiRequest('/stock-out', 'POST', {
      productId: config.productId,
      itemType: 'Finished Goods',
      quantity: 200, // We only have 85
    }, config.adminToken);
    
    assert(failStockOutRes.status === 400 || failStockOutRes.status === 500, 'Should fail when quantity exceeds inventory');
    console.log('✅ Insufficient stock properly rejected');

    console.log('\n🎉 ALL QA API TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ QA TEST FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

runTests();
