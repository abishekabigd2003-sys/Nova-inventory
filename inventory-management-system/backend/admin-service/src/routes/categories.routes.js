import express from 'express';
import Category from '../models/Category.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private (all roles)
router.get('/', protect, async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private (all roles)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
});

// @desc    Create category
// @route   POST /api/categories
// @access  Admin, Manager
router.post(
  '/',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        res.status(400);
        throw new Error('Category name is required');
      }
      const category = await Category.create({ name, description });
      res.status(201).json(category);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400);
        error.message = 'A category with this name already exists';
      }
      next(error);
    }
  }
);

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin, Manager
router.put(
  '/:id',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!category) {
        res.status(404);
        throw new Error('Category not found');
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) {
        res.status(404);
        throw new Error('Category not found');
      }
      res.json({ message: 'Category removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
