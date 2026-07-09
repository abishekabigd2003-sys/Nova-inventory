import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';

const MONGO_URI = process.env.MONGO_URI;

async function testUsers() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find();
  console.log('All users:');
  users.forEach(u => console.log(`- ${u.email} (Role: ${u.role}, Active: ${u.isActive})`));
  process.exit(0);
}
testUsers();
