import express from 'express';
import Purchase from '../models/Purchase.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplierId', 'name')
      .populate('productId', 'name sku price')
      .populate('createdBy', 'name')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    next(error);
  }
});

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierId', 'name email phone')
      .populate('productId', 'name sku price')
      .populate('createdBy', 'name');
    if (!purchase) {
      res.status(404);
      throw new Error('Purchase not found');
    }
    res.json(purchase);
  } catch (error) {
    next(error);
  }
});

// @desc    Create purchase
// @route   POST /api/purchases
// @access  Admin, Manager
router.post(
  '/',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const purchase = await Purchase.create({
        ...req.body,
        createdBy: req.user.id,
      });
      const populated = await Purchase.findById(purchase._id)
        .populate('supplierId', 'name')
        .populate('productId', 'name sku price')
        .populate('createdBy', 'name');
      res.status(201).json(populated);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update purchase
// @route   PUT /api/purchases/:id
// @access  Admin, Manager
router.put(
  '/:id',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const purchase = await Purchase.findById(req.params.id);
      if (!purchase) {
        res.status(404);
        throw new Error('Purchase not found');
      }

      // If status changes to Received, set receivedDate
      if (
        req.body.status === 'Received' &&
        purchase.status !== 'Received'
      ) {
        req.body.receivedDate = Date.now();
      }

      const updatedPurchase = await Purchase.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('supplierId', 'name')
        .populate('productId', 'name sku price')
        .populate('createdBy', 'name');

      res.json(updatedPurchase);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete purchase
// @route   DELETE /api/purchases/:id
// @access  Admin
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const purchase = await Purchase.findByIdAndDelete(req.params.id);
      if (!purchase) {
        res.status(404);
        throw new Error('Purchase not found');
      }
      res.json({ message: 'Purchase removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
