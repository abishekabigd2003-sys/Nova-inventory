import fetch from 'node-fetch';

async function runTest() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@inventory.com', password: 'Admin@123!' })
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in successfully. Token length:', token.length);

    // 2. Create Stock In
    console.log('Creating Stock In record...');
    const stockInRes = await fetch('http://localhost:5001/api/stockin', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        poDate: new Date().toISOString(),
        poNumber: 'PO-TEST-999',
        partyName: 'Test Supplier LLC',
        yarnCount: '40s',
        itemName: 'Cotton Yarn',
        color: 'White',
        baleCount: 15,
        weight: 1500
      })
    });
    
    if (!stockInRes.ok) {
      const errText = await stockInRes.text();
      throw new Error(`Stock In creation failed: ${errText}`);
    }
    
    const stockInData = await stockInRes.json();
    console.log('Created Stock In:', stockInData._id);
    console.log('Audit History:', JSON.stringify(stockInData.auditHistory, null, 2));

    // 3. Edit Stock In
    console.log('Updating Stock In record...');
    const stockInUpdateRes = await fetch(`http://localhost:5001/api/stockin/${stockInData._id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        baleCount: 20,
        weight: 2000
      })
    });

    if (!stockInUpdateRes.ok) {
      const errText = await stockInUpdateRes.text();
      throw new Error(`Stock In update failed: ${errText}`);
    }

    const updatedStockInData = await stockInUpdateRes.json();
    console.log('Updated Stock In, new Bale Count:', updatedStockInData.baleCount);
    console.log('Audit History after update:', JSON.stringify(updatedStockInData.auditHistory, null, 2));

  } catch (error) {
    console.error('Test Failed:', error);
  }
}

runTest();
