import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI environment variable is required.");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Staff' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', UserSchema);

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const adminEmail = 'admin@inventory.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists!');
    } else {
      const adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: 'Admin@123!',
        role: 'Admin',
      });
      await adminUser.save();
      console.log('Admin user seeded successfully!');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
}

seed();
