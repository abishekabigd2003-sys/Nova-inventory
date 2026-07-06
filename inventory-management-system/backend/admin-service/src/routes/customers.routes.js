import express from 'express';
import Customer from '../models/Customer.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// @desc    Create customer
// @route   POST /api/customers
// @access  Admin, Manager
router.post(
  '/',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const customer = await Customer.create(req.body);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Admin, Manager
router.put(
  '/:id',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
      }
      res.json(customer);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Admin
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const customer = await Customer.findByIdAndDelete(req.params.id);
      if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
      }
      res.json({ message: 'Customer removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
