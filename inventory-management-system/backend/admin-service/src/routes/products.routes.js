import express from 'express';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all products (with optional category filter)
// @route   GET /api/products
// @access  Private (all roles)
router.get('/', protect, async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category) query.categoryId = category;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private (all roles)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'categoryId',
      'name'
    );
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// @desc    Create product
// @route   POST /api/products
// @access  Admin
router.post(
  '/',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const product = await Product.create(req.body);
      const populated = await product.populate('categoryId', 'name');
      res.status(201).json(populated);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400);
        error.message = 'A product with this SKU already exists';
      }
      next(error);
    }
  }
);

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
router.put(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('categoryId', 'name');

      if (!product) {
        res.status(404);
        throw new Error('Product not found');
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update product inventory count (called internally by stock routes)
// @route   PUT /api/products/:id/inventory
// @access  Private
router.put('/:id/inventory', protect, async (req, res, next) => {
  try {
    const { action, amount } = req.body;
    const delta =
      action === 'increment' ? Number(amount) : -Number(amount);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { inventoryCount: delta } },
      { new: true }
    );

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        res.status(404);
        throw new Error('Product not found');
      }
      res.json({ message: 'Product removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
