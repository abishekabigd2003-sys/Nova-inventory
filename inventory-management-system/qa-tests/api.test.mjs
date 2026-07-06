import axios from 'axios';
import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';
let token = '';
let categoryId = '';
let productId = '';

async function testAPI() {
  console.log('--- Starting API Validation ---');
  try {
    // 1. Auth & Login
    console.log('Testing Authentication (POST /auth/login)...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@inventory.com',
      password: 'admin123'
    });
    assert.equal(loginRes.status, 200, 'Expected 200 OK');
    assert.ok(loginRes.data.token, 'Expected token in response');
    token = loginRes.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Negative Auth Test
    console.log('Testing Negative Auth (401 Unauthorized)...');
    try {
      await axios.get(`${API_BASE}/dashboard`, { headers: { Authorization: 'Bearer invalid' } });
      assert.fail('Should have failed with 401');
    } catch (e) {
      assert.equal(e.response.status, 401, 'Expected 401 Unauthorized');
    }

    // 3. Category Creation
    console.log('Testing Category Creation (POST /categories)...');
    const rand = Math.floor(Math.random() * 99999);
    const catRes = await axios.post(`${API_BASE}/categories`, {
      name: `API Test Category ${rand}`,
      description: 'Automated test'
    });
    assert.equal(catRes.status, 201, 'Expected 201 Created');
    categoryId = catRes.data._id;

    // 4. Product Creation
    console.log('Testing Product Creation (POST /products)...');
    const prodRes = await axios.post(`${API_BASE}/products`, {
      name: `API Test Product ${rand}`,
      sku: `API-SKU-${rand}`,
      categoryId,
      price: 150
    });
    assert.equal(prodRes.status, 201, 'Expected 201 Created');
    productId = prodRes.data._id;

    // 5. Stock Out validation
    console.log('Testing Stock Out Calculation (POST /stock-out)...');
    const stockInRes = await axios.post(`${API_BASE}/stock`, {
      productId,
      type: 'IN',
      quantity: 100,
      itemType: 'API Material',
      date: new Date().toISOString()
    });
    assert.equal(stockInRes.status, 201, 'Expected 201 Created');

    const stockOutRes = await axios.post(`${API_BASE}/stock-out`, {
      productId,
      quantity: 40,
      itemType: 'API Material',
      date: new Date().toISOString()
    });
    assert.equal(stockOutRes.status, 201, 'Expected 201 Created');

    // 6. Verify Inventory updated
    const finalProd = await axios.get(`${API_BASE}/products/${productId}`);
    assert.equal(finalProd.data.inventoryCount, 60, 'Expected inventory count to be exactly 60');

    // 7. Negative Stock Out
    console.log('Testing Negative Stock Out (400 Bad Request)...');
    try {
      await axios.post(`${API_BASE}/stock-out`, {
        productId,
        quantity: 100 // Exceeds available 60
      });
      assert.fail('Should have failed due to insufficient stock');
    } catch (e) {
      assert.equal(e.response.status, 400, 'Expected 400 Bad Request');
    }

    console.log('[SUCCESS] All API tests passed perfectly.');

  } catch (err) {
    if (err.response) {
      console.error(`[FAILED] API Test failed with status ${err.response.status}:`, err.response.data);
    } else {
      console.error(`[FAILED] API Test failed:`, err.message);
    }
    process.exit(1);
  }
}

testAPI();
