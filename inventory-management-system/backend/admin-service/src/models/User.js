import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a valid name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s.-]+$/, 'Please enter a valid name. (No numbers or special characters)'],
    },
    email: {
      type: String,
      required: [true, 'Please enter a valid email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      validate: {
        validator: function(v) {
          // If the password is already hashed (e.g. starts with $2a$ or $2b$), we skip the complex validation.
          if (v.startsWith('$2a$') || v.startsWith('$2b$')) return true;
          // Otherwise, validate the raw password
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(v);
        },
        message: 'Password must be at least 8 characters and contain 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
      },
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Staff'],
      default: 'Staff',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match entered password to hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;
