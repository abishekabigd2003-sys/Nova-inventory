import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a valid product name'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      match: [/^[a-zA-Z0-9\s.,&()-]+$/, 'Please enter a valid product name. (Invalid characters used)'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: 'Price must be a valid number'
      }
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: [0, 'Minimum stock level cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: 'Minimum stock level must be a valid number'
      }
    },
    inventoryCount: {
      type: Number,
      default: 0,
      min: [0, 'Inventory count cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: 'Inventory count must be a valid number'
      }
    },
    totalWeight: {
      type: Number,
      default: 0,
      min: [0, 'Total weight cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: 'Total weight must be a valid number'
      }
    },
    totalBales: {
      type: Number,
      default: 0,
      min: [0, 'Total bales cannot be negative'],
      validate: {
        validator: Number.isFinite,
        message: 'Total bales must be a valid number'
      }
    },
  },
  { timestamps: true }
);

productSchema.index({ status: 1 });

export default mongoose.model('Product', productSchema);
