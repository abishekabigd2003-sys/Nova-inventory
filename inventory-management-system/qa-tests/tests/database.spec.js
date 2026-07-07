import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/ims_admin_db';

test.describe('Database Integrity and CRUD Validations', () => {
  let db;

  test.beforeAll(async () => {
    await mongoose.connect(MONGO_URI);
    db = mongoose.connection.db;
  });

  test.afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Verify required collections exist', async () => {
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);
    const required = ['users', 'categories', 'products'];
    
    for (const req of required) {
      expect(names).toContain(req);
    }
  });

  test('Data consistency: Products reference valid Categories', async () => {
    const Product = mongoose.connection.collection('products');
    const Category = mongoose.connection.collection('categories');

    const products = await Product.find({}).limit(50).toArray(); // sample for speed
    
    for (const p of products) {
      if (p.categoryId) {
        const cat = await Category.findOne({ _id: p.categoryId });
        expect(cat, `Product ${p.sku} has invalid categoryId ${p.categoryId}`).not.toBeNull();
      }
    }
  });

  test('Data integrity: Inventory count is non-negative', async () => {
    const Product = mongoose.connection.collection('products');
    const products = await Product.find({ inventoryCount: { $lt: 0 } }).toArray();
    
    expect(products.length, `Found ${products.length} products with negative inventory`).toBe(0);
  });
});
