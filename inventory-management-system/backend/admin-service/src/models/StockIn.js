import mongoose from 'mongoose';

const stockInSchema = new mongoose.Schema(
  {
    poDate: {
      type: Date,
      required: [true, 'PO Date is required'],
      default: Date.now,
      index: true,
    },
    poNumber: {
      type: String,
      trim: true,
      required: [true, 'PO Number is required'],
    },
    partyName: {
      type: String,
      trim: true,
      required: [true, 'Party Name is required'],
      index: true,
    },
    yarnCount: {
      type: String,
      trim: true,
      required: [true, 'Yarn Count is required'],
    },
    itemName: {
      type: String,
      trim: true,
      required: [true, 'Item Name is required'],
    },
    color: {
      type: String,
      trim: true,
    },
    baleCount: {
      type: Number,
      required: [true, 'Number of Bales is required'],
      min: [1, 'Must have at least 1 bale'],
      validate: {
        validator: Number.isInteger,
        message: 'Bale count must be an integer'
      }
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0, 'Weight must be a positive number'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    auditHistory: [
      {
        action: {
          type: String,
          enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'],
          required: true,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }
    ],
  },
  { timestamps: true }
);

// Compound indexes for optimal querying
stockInSchema.index({ poDate: -1, status: 1 });

export default mongoose.model('StockIn', stockInSchema);
