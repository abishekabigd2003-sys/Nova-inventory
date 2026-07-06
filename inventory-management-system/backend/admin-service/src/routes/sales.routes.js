import express from 'express';
import Sale from '../models/Sale.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .populate('customerId', 'name email')
      .populate('productId', 'name sku price')
      .populate('createdBy', 'name')
      .sort({ saleDate: -1 });
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customerId', 'name email phone address')
      .populate('productId', 'name sku price')
      .populate('createdBy', 'name');
    if (!sale) {
      res.status(404);
      throw new Error('Sale not found');
    }
    res.json(sale);
  } catch (error) {
    next(error);
  }
});

// @desc    Create sale
// @route   POST /api/sales
// @access  Admin, Manager
router.post(
  '/',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const sale = await Sale.create({
        ...req.body,
        createdBy: req.user.id,
      });
      const populated = await Sale.findById(sale._id)
        .populate('customerId', 'name')
        .populate('productId', 'name sku price')
        .populate('createdBy', 'name');
      res.status(201).json(populated);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Admin, Manager
router.put(
  '/:id',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate('customerId', 'name')
        .populate('productId', 'name sku price')
        .populate('createdBy', 'name');

      if (!sale) {
        res.status(404);
        throw new Error('Sale not found');
      }
      res.json(sale);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Admin
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const sale = await Sale.findByIdAndDelete(req.params.id);
      if (!sale) {
        res.status(404);
        throw new Error('Sale not found');
      }
      res.json({ message: 'Sale removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
