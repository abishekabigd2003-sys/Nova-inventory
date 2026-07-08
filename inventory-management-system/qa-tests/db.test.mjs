import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI environment variable is required.");

async function runDBTest() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  try {
    const db = mongoose.connection.db;

    // 1. Check Collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Collections:', collectionNames);

    const requiredCollections = ['users', 'categories', 'products', 'stockins', 'stockouts', 'requests'];
    for (const req of requiredCollections) {
      if (!collectionNames.includes(req)) {
        console.warn(`[WARNING] Missing expected collection: ${req}`);
      }
    }

    // 2. Validate Data Integrity (Products -> Categories)
    const Product = mongoose.connection.collection('products');
    const Category = mongoose.connection.collection('categories');

    const products = await Product.find({}).toArray();
    let invalidRefs = 0;
    
    for (const p of products) {
      if (p.categoryId) {
        const cat = await Category.findOne({ _id: p.categoryId });
        if (!cat) {
          console.error(`[ERROR] Product ${p.sku} references a non-existent categoryId: ${p.categoryId}`);
          invalidRefs++;
        }
      } else {
        console.error(`[ERROR] Product ${p.sku} is missing categoryId`);
        invalidRefs++;
      }

      if (p.inventoryCount < 0) {
        console.error(`[ERROR] Product ${p.sku} has negative inventory: ${p.inventoryCount}`);
        invalidRefs++;
      }
    }

    if (invalidRefs === 0) {
      console.log('[SUCCESS] Database integrity checks passed. No invalid references or negative inventory.');
    } else {
      console.error(`[FAILED] Database integrity checks failed with ${invalidRefs} errors.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runDBTest();
