import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://abishekabigd2003_db_user:Admin2003aa@cluster0.oq4a6dp.mongodb.net/inventory_db?retryWrites=true&w=majority&appName=Cluster0";

const seedProducts = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    let category = await Category.findOne({ name: 'Raw Materials' });
    if (!category) {
      category = await Category.create({ name: 'Raw Materials', description: 'Basic raw materials for production' });
    }
    
    let finishedGoodsCategory = await Category.findOne({ name: 'Finished Goods' });
    if (!finishedGoodsCategory) {
      finishedGoodsCategory = await Category.create({ name: 'Finished Goods', description: 'Final products ready for dispatch' });
    }

    const mockProducts = [
      { name: 'Premium Cotton Yarn (40s)', sku: 'CY-40S-PRM', categoryId: category._id, price: 12.50, description: 'High quality 40s cotton yarn for premium shirting.', status: 'Active', minStockLevel: 50 },
      { name: 'Polyester Blend (30s)', sku: 'PB-30S-STD', categoryId: category._id, price: 8.75, description: 'Standard polyester blend for everyday use.', status: 'Active', minStockLevel: 100 },
      { name: 'Organic Silk Thread', sku: 'ST-ORG-01', categoryId: category._id, price: 45.00, description: '100% organic silk thread.', status: 'Active', minStockLevel: 20 },
      { name: 'Recycled Denim Fabric', sku: 'DF-REC-50', categoryId: finishedGoodsCategory._id, price: 22.00, description: '50m roll of recycled denim fabric.', status: 'Active', minStockLevel: 10 },
      { name: 'Nylon Parachute Cord', sku: 'NC-550-BLK', categoryId: category._id, price: 15.00, description: 'Black 550 paracord roll (100m).', status: 'Active', minStockLevel: 30 },
      { name: 'Woolen Spun Yarn', sku: 'WY-SPN-GRY', categoryId: category._id, price: 18.50, description: 'Grey woolen spun yarn for winter wear.', status: 'Active', minStockLevel: 40 },
      { name: 'Linen Blend Fabric', sku: 'LF-BLN-WHT', categoryId: finishedGoodsCategory._id, price: 35.00, description: 'White linen blend fabric roll (50m).', status: 'Active', minStockLevel: 15 },
      { name: 'Industrial Canvas Heavy', sku: 'IC-HVY-OD', categoryId: finishedGoodsCategory._id, price: 42.00, description: 'Heavy duty olive drab canvas.', status: 'Active', minStockLevel: 10 },
      { name: 'Viscose Rayon Thread', sku: 'VT-RAY-BLU', categoryId: category._id, price: 9.50, description: 'Blue viscose rayon thread.', status: 'Active', minStockLevel: 100 },
      { name: 'Spandex Elastic Roll', sku: 'SE-RLL-WHT', categoryId: category._id, price: 11.25, description: 'White elastic roll for waistbands.', status: 'Active', minStockLevel: 50 },
      { name: 'Merino Wool Roving', sku: 'MW-ROV-NAT', categoryId: category._id, price: 55.00, description: 'Natural un-dyed merino wool roving.', status: 'Active', minStockLevel: 25 },
      { name: 'Kevlar Aramid Fiber', sku: 'KV-ARM-YLW', categoryId: category._id, price: 120.00, description: 'High strength yellow kevlar fiber.', status: 'Active', minStockLevel: 5 }
    ];

    console.log(`Seeding ${mockProducts.length} products...`);
    
    let inserted = 0;
    for (const prod of mockProducts) {
      const exists = await Product.findOne({ sku: prod.sku });
      if (!exists) {
        await Product.create(prod);
        inserted++;
      }
    }

    console.log(`Successfully seeded ${inserted} new products!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedProducts();
