import mongoose from 'mongoose';

const editRequestSchema = new mongoose.Schema(
  {
    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stock',
      required: [true, 'Stock ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    requestedChanges: {
      quantity: { type: Number },
      color: { type: String },
      bale: { type: String },
      weight: { type: Number },
      supplier: { type: String },
      notes: { type: String },
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
      default: 'Pending',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: { type: Date },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    completedAt: { type: Date },
    // OTP fields — excluded from normal queries for security
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

export default mongoose.model('EditRequest', editRequestSchema);
