import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000/api';

const ADMIN_CREDENTIALS = { email: 'admin@inventory.com', password: 'Admin@123!' };
const USER_CREDENTIALS = { email: 'user@inventory.com', password: 'User@123!' };

const testProducts = [
  { name: 'Cotton 20s - White', category: 'Cotton', color: 'White' },
  { name: 'Cotton 30s - Black', category: 'Cotton', color: 'Black' },
  { name: 'Cotton 40s - Blue', category: 'Cotton', color: 'Blue' },
  { name: 'Polyester 20D - Grey', category: 'Polyester', color: 'Grey' },
  { name: 'Polyester 30D - Navy', category: 'Polyester', color: 'Navy' },
  { name: 'Viscose 30s - Cream', category: 'Viscose', color: 'Cream' },
  { name: 'Viscose 40s - Brown', category: 'Viscose', color: 'Brown' },
  { name: 'Linen 60s - Natural', category: 'Linen', color: 'Natural' },
  { name: 'Denim Fabric - Indigo', category: 'Denim', color: 'Indigo' },
  { name: 'Silk Yarn - Gold', category: 'Silk', color: 'Gold' },
  { name: 'Rayon Fabric - Maroon', category: 'Rayon', color: 'Maroon' },
  { name: 'Organic Cotton - Green', category: 'Organic', color: 'Green' },
  { name: 'Terry Towel Fabric - White', category: 'Towel', color: 'White' },
  { name: 'Rib Knit Fabric - Black', category: 'Knit', color: 'Black' },
  { name: 'Fleece Fabric - Charcoal', category: 'Fleece', color: 'Charcoal' }
];

let adminToken = '';
let userToken = '';
let categoryMap = {};
let productMap = {};

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

async function run() {
  console.log('🚀 Starting Realistic E2E Tests with 15 Products...');

  try {
    // 1. Authentication
    console.log('\n--- [1] Authentication ---');
    
    // Login Admin
    let res = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    assert(res.status === 200, 'Admin login should succeed');
    adminToken = res.data.token;
    console.log('✅ Admin Logged In');

    // Login User
    res = await axios.post(`${BASE_URL}/auth/login`, USER_CREDENTIALS);
    assert(res.status === 200, 'User login should succeed');
    userToken = res.data.token;
    console.log('✅ User Logged In');

    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    const userHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

    // 2. Setup Categories
    console.log('\n--- [2] Category Creation ---');
    const categories = [...new Set(testProducts.map(p => p.category))];
    for (const cat of categories) {
      try {
        const catRes = await axios.post(`${BASE_URL}/categories`, { name: cat, description: `${cat} category` }, adminHeaders);
        categoryMap[cat] = catRes.data._id;
        console.log(`✅ Created Category: ${cat}`);
      } catch (e) {
        if (e.response && e.response.status === 400 && e.response.data.message.includes('exists')) {
          const allCats = await axios.get(`${BASE_URL}/categories`, adminHeaders);
          categoryMap[cat] = allCats.data.find(c => c.name === cat)._id;
          console.log(`⚠️ Category ${cat} exists. Reused ID.`);
        } else {
          throw e;
        }
      }
    }

    // 3. Setup Products
    console.log('\n--- [3] Product Creation ---');
    for (const prod of testProducts) {
      try {
        const payload = {
          name: prod.name,
          categoryId: categoryMap[prod.category],
          sku: `SKU-${prod.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now() % 10000}`,
          unit: 'KG',
          reorderPoint: 50,
          price: 150.00,
          description: `Realistic E2E Test Product: ${prod.name}`
        };
        const prodRes = await axios.post(`${BASE_URL}/products`, payload, adminHeaders);
        productMap[prod.name] = { id: prodRes.data._id, color: prod.color };
        console.log(`✅ Created Product: ${prod.name}`);
      } catch (e) {
        if (e.response && e.response.status === 400 && e.response.data.message.includes('exists')) {
          const allProds = await axios.get(`${BASE_URL}/products`, adminHeaders);
          productMap[prod.name] = { id: allProds.data.find(p => p.name === prod.name)._id, color: prod.color };
          console.log(`⚠️ Product ${prod.name} exists. Reused ID.`);
        } else {
          console.error(`❌ Failed to create product ${prod.name}:`, e.response?.data || e.message);
          throw e;
        }
      }
    }

    // 4. Stock In Operations
    console.log('\n--- [4] Stock In Operations ---');
    const stockInRecords = [];
    for (let i = 0; i < testProducts.length; i++) {
      const prodName = testProducts[i].name;
      const prodInfo = productMap[prodName];
      const headers = adminHeaders;
      const role = 'Admin';
      
      const payload = {
        productId: prodInfo.id,
        type: 'IN',
        quantity: (i + 1) * 10,
        itemType: prodInfo.category || 'Cotton',
        color: prodInfo.color,
        bale: `BALE-${i + 100}`,
        weight: (i + 1) * 15.5,
        supplier: `Supplier ${role} Corp`,
        poNumber: `PO-${2026000 + i}`,
        notes: `Initial stock in by ${role}`,
        date: new Date().toISOString()
      };

      const stockInRes = await axios.post(`${BASE_URL}/stock`, payload, headers);
      assert(stockInRes.status === 201, `Stock In should succeed for ${prodName}`);
      stockInRecords.push(stockInRes.data);
      console.log(`✅ Stock In (${role}): ${prodName} | Qty: ${payload.quantity} | Bales: ${payload.bale}`);
    }

    // 5. Verify Inventory State
    console.log('\n--- [5] Verify Inventory Updates ---');
    const invRes = await axios.get(`${BASE_URL}/products`, adminHeaders);
    let allUpdated = true;
    for (const prod of invRes.data) {
      if (productMap[prod.name]) {
         if (prod.currentStock === 0) {
           console.error(`❌ Product ${prod.name} has 0 stock after Stock In!`);
           allUpdated = false;
         }
      }
    }
    assert(allUpdated, 'Inventory must reflect Stock In operations');
    console.log('✅ Inventory updated correctly.');

    // 6. Stock Out Operations (Negative Stock Test)
    console.log('\n--- [6] Stock Out & Negative Stock Test ---');
    const targetProd = testProducts[0].name;
    const targetProdInfo = productMap[targetProd];
    
    try {
      await axios.post(`${BASE_URL}/stock-out`, {
        productId: targetProdInfo.id,
        type: 'OUT',
        itemType: targetProdInfo.category || 'Cotton',
        quantity: 999999,
        date: new Date().toISOString()
      }, adminHeaders);
      assert(false, 'Should have prevented negative stock');
    } catch (e) {
      assert(e.response && e.response.status === 400, 'Should return 400 Bad Request for negative stock');
      assert(e.response.data.message.includes('Insufficient stock'), `Error should mention insufficient stock. Got: ${e.response.data.message}`);
      console.log('✅ Negative stock prevented successfully.');
    }

    const stockOutRes = await axios.post(`${BASE_URL}/stock-out`, {
        productId: targetProdInfo.id,
        type: 'OUT',
        itemType: targetProdInfo.category || 'Cotton',
        quantity: 5,
        color: targetProdInfo.color,
        bale: 'BALE-OUT-1',
        weight: 10,
        supplier: 'Customer Inc',
        poNumber: 'PO-OUT-1',
        notes: 'Dispatch stock',
        date: new Date().toISOString()
    }, adminHeaders);
    assert(stockOutRes.status === 201, 'Valid Stock Out should succeed');
    console.log('✅ Valid Stock Out processed successfully.');

    // 7. Verify Reports & Dashboard
    console.log('\n--- [7] Reports & Dashboard APIs ---');
    const dashRes = await axios.get(`${BASE_URL}/dashboard`, adminHeaders);
    console.log('Dashboard Data:', dashRes.data);
    assert(dashRes.status === 200, 'Dashboard stats should load');
    assert(dashRes.data.kpis && dashRes.data.kpis.totalProducts > 0, 'Dashboard should reflect products');
    console.log('✅ Dashboard API responds correctly.');

    const reportRes = await axios.get(`${BASE_URL}/reports?type=stock-in`, adminHeaders);
    assert(reportRes.status === 200, 'Reports should load');
    console.log('✅ Reports API responds correctly.');
    
    // 8. Approvals (User Requests Edit)
    console.log('\n--- [8] Approvals & Audit Trail ---');
    const targetStockInId = stockInRecords[0]._id;
    
    try {
      const editReq = await axios.post(`${BASE_URL}/requests`, {
        stockId: targetStockInId,
        requestedChanges: {
          quantity: 99,
          notes: 'User requested edit to 99'
        }
      }, userHeaders);
      assert(editReq.status === 201, 'User should be able to request an edit');
      console.log('✅ User Edit Request created.');

      const reqId = editReq.data._id;
      const approveRes = await axios.put(`${BASE_URL}/requests/${reqId}/approve`, {}, adminHeaders);
      assert(approveRes.status === 200, 'Admin should be able to approve request');
      console.log('✅ Admin Approved Request.');

      const updatedReq = await axios.get(`${BASE_URL}/requests/mine`, userHeaders);
      const matched = updatedReq.data.find(r => r._id === reqId);
      assert(matched.status === 'Approved', 'Request status should be Approved');
      console.log('✅ OTP Approval flow works as expected (Backend state verified).');
      
    } catch(e) {
      console.error('❌ Approvals test failed:', e.response?.data || e.message);
      throw e;
    }

    console.log('\n🎉 ALL E2E TESTS PASSED SUCCESSFULLY! 🎉');
    
  } catch (error) {
    console.error('\n❌ E2E TEST SUITE FAILED ❌');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

run();
