import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const seedAdmin = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ims_admin_db');
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
  } catch (error) {
    console.error('[admin-service] Error seeding admin:', error);
  }
};

if (process.argv[1].endsWith('seedAdmin.js')) {
  seedAdmin().then(() => process.exit(0));
}
