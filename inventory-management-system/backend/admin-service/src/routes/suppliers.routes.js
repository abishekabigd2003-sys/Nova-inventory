import express from 'express';
import Supplier from '../models/Supplier.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Admin, Manager
router.post(
  '/',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const supplier = await Supplier.create(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Admin, Manager
router.put(
  '/:id',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const supplier = await Supplier.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!supplier) {
        res.status(404);
        throw new Error('Supplier not found');
      }
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Admin
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const supplier = await Supplier.findByIdAndDelete(req.params.id);
      if (!supplier) {
        res.status(404);
        throw new Error('Supplier not found');
      }
      res.json({ message: 'Supplier removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
