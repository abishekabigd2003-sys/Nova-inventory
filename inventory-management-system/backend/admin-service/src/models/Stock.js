import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['IN', 'OUT'],
      required: [true, 'Stock type is required'],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isFinite,
        message: 'Quantity must be a valid number'
      }
    },
    itemType: { 
      type: String, 
      required: [true, 'Item type is required'] 
    },
    color: { type: String, trim: true },
    bale: { type: String, trim: true },
    weight: { 
      type: Number, 
      min: [0, 'Weight must be a positive number'],
      validate: {
        validator: function(v) { return v === undefined || v === null || Number.isFinite(v); },
        message: 'Weight must be a valid number'
      }
    },
    supplier: { type: String, trim: true }, // For Stock IN
    destination: { type: String, trim: true }, // For Stock OUT (legacy)
    customerName: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },
    date: { type: Date, default: Date.now, index: true },
    notes: { type: String, trim: true },
    imagePath: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
stockSchema.index({ productId: 1, date: -1 });
stockSchema.index({ type: 1, status: 1 });
stockSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('Stock', stockSchema);
