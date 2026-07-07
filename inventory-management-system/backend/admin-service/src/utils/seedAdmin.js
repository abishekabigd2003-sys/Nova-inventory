import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const seedAdmin = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in environment variables.');
      }
      await mongoose.connect(process.env.MONGO_URI);
    }
    const adminEmail = 'admin@inventory.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: 'Admin@123!',
        role: 'Admin',
        isActive: true,
      });
      console.log('[admin-service] Default Admin seeded: admin@inventory.com / Admin@123!');
    } else {
      console.log('[admin-service] Default Admin already exists.');
    }

    const testUserEmail = 'testuser2@inventory.com';
    const existingTestUser = await User.findOne({ email: testUserEmail });
    if (!existingTestUser) {
      await User.create({
        name: 'Test User',
        email: testUserEmail,
        password: 'password123',
        role: 'Staff',
        isActive: true,
      });
      console.log(`[admin-service] Test user seeded: ${testUserEmail}`);
    }
  } catch (error) {
    console.error('[admin-service] Error seeding admin:', error);
  }
};

if (process.argv[1].endsWith('seedAdmin.js')) {
  seedAdmin().then(() => process.exit(0));
}
