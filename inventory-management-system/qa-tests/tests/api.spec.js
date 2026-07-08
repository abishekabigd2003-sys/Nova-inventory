import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_GATEWAY_URL ? `${process.env.API_GATEWAY_URL}/api` : 'http://127.0.0.1:5000/api';

test.describe('API Endpoint Validations', () => {
  let token = '';
  let categoryId = '';
  let productId = '';

  test('Auth Login (POST /auth/login)', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: 'admin@inventory.com',
        password: 'Admin@123!'
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    token = body.token;
  });

  test('Unauthorized Access without Token', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: 'Bearer invalid' }
    });
    expect(response.status()).toBe(401);
  });

  test('Create Category (POST /categories)', async ({ request }) => {
    test.skip(!token, 'Requires auth token');
    const rand = Math.floor(Math.random() * 99999);
    const response = await request.post(`${API_BASE}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: `API Category ${rand}`,
        description: 'Test category'
      }
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    categoryId = body._id;
    expect(categoryId).toBeDefined();
  });

  test('Create Product (POST /products)', async ({ request }) => {
    test.skip(!token || !categoryId, 'Requires auth token and categoryId');
    const rand = Math.floor(Math.random() * 99999);
    const response = await request.post(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: `API Product ${rand}`,
        sku: `SKU-${rand}`,
        categoryId,
        price: 150
      }
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    productId = body._id;
    expect(productId).toBeDefined();
  });
  
  test('Negative Stock Out Calculation', async ({ request }) => {
    test.skip(!token || !productId, 'Requires auth token and productId');
    const response = await request.post(`${API_BASE}/stock-out`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        productId,
        quantity: 99999, // Intentional excessive quantity
        itemType: 'API Material',
        date: new Date().toISOString()
      }
    });
    expect(response.status()).toBe(400);
  });
});
