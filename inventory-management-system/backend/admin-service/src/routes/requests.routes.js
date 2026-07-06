import express from 'express';
import EditRequest from '../models/EditRequest.js';
import Stock from '../models/Stock.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { generateOTP, sendOTP } from '../utils/sendOtp.js';
import { getIO } from '../socket.js';

const router = express.Router();

// @desc    Get all requests (Admin sees all; others see their own)
// @route   GET /api/requests
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const query =
      req.user.role === 'Admin' ? {} : { userId: req.user.id };

    const requests = await EditRequest.find(query)
      .populate('userId', 'name email')
      .populate('stockId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// @desc    Get current user's own requests
// @route   GET /api/requests/mine
// @access  Private
router.get('/mine', protect, async (req, res, next) => {
  try {
    const requests = await EditRequest.find({ userId: req.user.id })
      .populate('stockId')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// @desc    Get pending requests count (for admin badge)
// @route   GET /api/requests/pending-count
// @access  Admin
router.get('/pending-count', protect, authorize('Admin'), async (req, res, next) => {
  try {
    const count = await EditRequest.countDocuments({ status: 'Pending' });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// @desc    Submit an edit request
// @route   POST /api/requests
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { stockId, requestedChanges } = req.body;

    if (!stockId || !requestedChanges) {
      res.status(400);
      throw new Error('stockId and requestedChanges are required');
    }

    // Check if there's already a pending/approved request for this stock
    const existing = await EditRequest.findOne({
      stockId,
      userId: req.user.id,
      status: { $in: ['Pending', 'Approved'] },
    });

    if (existing) {
      res.status(400);
      throw new Error('You already have an active edit request for this stock record. Wait for it to be resolved.');
    }

    const request = await EditRequest.create({
      stockId,
      userId: req.user.id,
      requestedChanges,
      status: 'Pending',
    });

    // Notify all admins directly from DB (no cross-service fetch)
    const admins = await User.find({ role: 'Admin', isActive: true }).select('_id name');
    if (admins.length > 0) {
      const user = await User.findById(req.user.id).select('name');
      const notifications = admins.map((admin) => ({
        recipientId: admin._id,
        message: `📋 ${user?.name || 'A user'} has submitted an edit request for stock record #${stockId.toString().slice(-6).toUpperCase()}`,
        type: 'INFO',
      }));
      await Notification.insertMany(notifications);
      
      // Real-time broadcast
      try {
        const io = getIO();
        io.emit('NEW_EDIT_REQUEST', {
          message: `New edit request from ${user?.name || 'A user'}`,
          request
        });
      } catch (err) {
        console.error('Socket error:', err.message);
      }
    }

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// @desc    Admin approves request (generates OTP)
// @route   PUT /api/requests/:id/approve
// @access  Admin
router.put(
  '/:id/approve',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const request = await EditRequest.findById(req.params.id)
        .populate('userId', 'email name');

      if (!request) {
        res.status(404);
        throw new Error('Request not found');
      }
      if (request.status !== 'Pending') {
        res.status(400);
        throw new Error('Only pending requests can be approved');
      }

      const otp = generateOTP();

      request.status = 'Approved';
      request.approvedBy = req.user.id;
      request.approvedAt = new Date();
      request.otp = otp;
      request.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
      await request.save();

      await sendOTP(request.userId.email, otp);

      await Notification.create({
        recipientId: request.userId._id,
        message: '✅ Your edit request was APPROVED. Check your email for the OTP to proceed.',
        type: 'SUCCESS',
      });

      try {
        const io = getIO();
        io.emit('REQUEST_APPROVED', {
          recipientId: request.userId._id,
          message: 'Your edit request was approved. Check email for OTP.'
        });
      } catch(e) {}

      res.json({ message: 'Request approved and OTP sent to user email' });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Admin rejects request
// @route   PUT /api/requests/:id/reject
// @access  Admin
router.put(
  '/:id/reject',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const request = await EditRequest.findById(req.params.id)
        .populate('userId', 'name');

      if (!request) {
        res.status(404);
        throw new Error('Request not found');
      }
      if (!['Pending', 'Approved'].includes(request.status)) {
        res.status(400);
        throw new Error('Only pending or approved requests can be rejected');
      }

      const { reason } = req.body;

      request.status = 'Rejected';
      request.rejectedAt = new Date();
      request.rejectedBy = req.user.id;
      request.rejectionReason = reason || null;
      await request.save();

      await Notification.create({
        recipientId: request.userId,
        message: `❌ Your edit request was REJECTED by Admin.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'ERROR',
      });

      try {
        const io = getIO();
        io.emit('REQUEST_REJECTED', {
          recipientId: request.userId._id,
          message: 'Your edit request was rejected.'
        });
      } catch(e) {}

      res.json({ message: 'Request rejected' });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Resend OTP to user (Admin action or user triggered)
// @route   POST /api/requests/:id/resend-otp
// @access  Private (request owner or Admin)
router.post('/:id/resend-otp', protect, async (req, res, next) => {
  try {
    const request = await EditRequest.findById(req.params.id)
      .populate('userId', 'email name');

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }

    // Only the request owner or admin can resend
    if (
      request.userId._id.toString() !== req.user.id &&
      req.user.role !== 'Admin'
    ) {
      res.status(403);
      throw new Error('Unauthorized');
    }

    if (request.status !== 'Approved') {
      res.status(400);
      throw new Error('Request must be in Approved state to resend OTP');
    }

    const otp = generateOTP();
    request.otp = otp;
    request.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await request.save();

    await sendOTP(request.userId.email, otp);

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
});

// @desc    User verifies OTP and finalizes edit
// @route   POST /api/requests/:id/verify-otp
// @access  Private
router.post('/:id/verify-otp', protect, async (req, res, next) => {
  try {
    const { otp } = req.body;

    // Select OTP fields explicitly (they are select: false)
    const request = await EditRequest.findById(req.params.id).select(
      '+otp +otpExpiresAt'
    );

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }
    if (request.status !== 'Approved') {
      res.status(400);
      throw new Error('Request is not in Approved state');
    }
    if (request.userId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Unauthorized: this is not your request');
    }
    if (new Date() > request.otpExpiresAt) {
      res.status(400);
      throw new Error('OTP has expired. Please request a new OTP.');
    }
    if (request.otp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP. Please check and try again.');
    }

    // OTP is valid — return success so frontend can open the edit form
    // The actual save happens via PUT /api/requests/:id/complete
    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (error) {
    next(error);
  }
});

// @desc    Complete the edit after OTP verification (apply changes to stock)
// @route   PUT /api/requests/:id/complete
// @access  Private (request owner only)
router.put('/:id/complete', protect, async (req, res, next) => {
  try {
    const { changes } = req.body;

    // Re-check the request (with OTP for final validation)
    const request = await EditRequest.findById(req.params.id).select('+otp +otpExpiresAt');

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }
    if (request.userId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Unauthorized');
    }
    if (request.status !== 'Approved') {
      res.status(400);
      throw new Error('Request must be in Approved status to complete');
    }

    // Get stock record
    const stock = await Stock.findById(request.stockId);
    if (!stock) {
      res.status(404);
      throw new Error('Original stock record not found');
    }

    // Save previous values for audit
    const previousValues = {
      quantity: stock.quantity,
      color: stock.color,
      bale: stock.bale,
      weight: stock.weight,
      supplier: stock.supplier,
      notes: stock.notes,
    };

    // Use provided changes or fall back to requestedChanges
    const finalChanges = changes || request.requestedChanges;

    // Calculate inventory diff if quantity changed
    const newQty = finalChanges.quantity;
    const diff = newQty !== undefined ? Number(newQty) - stock.quantity : 0;

    const newWeight = finalChanges.weight;
    const prevWeight = stock.weight ? Number(stock.weight) : 0;
    const weightDiff = newWeight !== undefined ? Number(newWeight) - prevWeight : 0;

    const newBale = finalChanges.bale;
    const prevBale = stock.bale && !isNaN(Number(stock.bale)) ? Number(stock.bale) : 0;
    const parsedNewBale = newBale && !isNaN(Number(newBale)) ? Number(newBale) : 0;
    const baleDiff = newBale !== undefined ? parsedNewBale - prevBale : 0;

    // Apply changes (only defined fields)
    Object.keys(finalChanges).forEach((key) => {
      if (finalChanges[key] !== undefined && finalChanges[key] !== '') {
        stock[key] = finalChanges[key];
      }
    });
    await stock.save();

    // Update product inventory if quantity changed
    if (diff !== 0 || weightDiff !== 0 || baleDiff !== 0) {
      const inventoryDelta = stock.type === 'IN' ? diff : -diff;
      const weightDelta = stock.type === 'IN' ? weightDiff : -weightDiff;
      const baleDelta = stock.type === 'IN' ? baleDiff : -baleDiff;

      // Prevent negative inventory
      if (inventoryDelta < 0) {
        const product = await Product.findById(stock.productId);
        if (product && product.inventoryCount + inventoryDelta < 0) {
          res.status(400);
          throw new Error(`Insufficient stock for this edit. Available: ${product.inventoryCount}, Requested difference: ${-inventoryDelta}`);
        }
      }

      await Product.findByIdAndUpdate(stock.productId, {
        $inc: { 
          inventoryCount: inventoryDelta,
          totalWeight: weightDelta,
          totalBales: baleDelta
        },
      });
    }

    // Create audit log
    await AuditLog.create({
      stockId: stock._id,
      editedBy: req.user.id,
      approvedBy: request.approvedBy,
      previousValues,
      newValues: finalChanges,
      action: 'UPDATE',
    });

    // Mark request as completed and clear OTP
    request.status = 'Completed';
    request.completedAt = new Date();
    request.otp = undefined;
    request.otpExpiresAt = undefined;
    await request.save();

    res.json({ message: 'Stock record updated successfully', stock });
  } catch (error) {
    next(error);
  }
});

export default router;
