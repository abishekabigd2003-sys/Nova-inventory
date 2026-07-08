import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';

const MONGO_URI = process.env.MONGO_URI;

async function testLogin() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ email: 'admin@inventory.com' });
  if (!user) {
    console.log('User not found');
  } else {
    console.log('User found:', user.email, 'isActive:', user.isActive, 'hashedPassword:', user.password);
    const match = await user.matchPassword('Admin@123!');
    console.log('Password match:', match);
  }
  process.exit(0);
}
testLogin();
