import express from 'express';
import StockIn from '../models/StockIn.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all Stock In records
// @route   GET /api/stockin
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { partyName: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } },
      ];
    }

    const records = await StockIn.find(query)
      .populate('createdBy', 'name')
      .sort({ poDate: -1, createdAt: -1 });

    res.json(records);
  } catch (error) {
    next(error);
  }
});

// @desc    Get single Stock In record
// @route   GET /api/stockin/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const record = await StockIn.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!record) {
      res.status(404);
      throw new Error('Stock In record not found');
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
});

// @desc    Create a Stock In record
// @route   POST /api/stockin
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      poDate,
      poNumber,
      partyName,
      yarnCount,
      itemName,
      color,
      baleCount,
      weight,
      status
    } = req.body;

    const record = await StockIn.create({
      poDate: poDate || Date.now(),
      poNumber,
      partyName,
      yarnCount,
      itemName,
      color,
      baleCount: Number(baleCount),
      weight: Number(weight),
      status: status || 'Approved',
      createdBy: req.user.id
    });

    const populated = await StockIn.findById(record._id).populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// @desc    Update a Stock In record
// @route   PUT /api/stockin/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('Admin'), async (req, res, next) => {
  try {
    const record = await StockIn.findById(req.params.id);

    if (!record) {
      res.status(404);
      throw new Error('Stock In record not found');
    }

    const {
      poDate,
      poNumber,
      partyName,
      yarnCount,
      itemName,
      color,
      baleCount,
      weight,
      status
    } = req.body;

    if (poDate !== undefined) record.poDate = poDate;
    if (poNumber !== undefined) record.poNumber = poNumber;
    if (partyName !== undefined) record.partyName = partyName;
    if (yarnCount !== undefined) record.yarnCount = yarnCount;
    if (itemName !== undefined) record.itemName = itemName;
    if (color !== undefined) record.color = color;
    if (baleCount !== undefined) record.baleCount = Number(baleCount);
    if (weight !== undefined) record.weight = Number(weight);
    if (status !== undefined) record.status = status;

    const updated = await record.save();
    const populated = await StockIn.findById(updated._id).populate('createdBy', 'name');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a Stock In record
// @route   DELETE /api/stockin/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('Admin'), async (req, res, next) => {
  try {
    const record = await StockIn.findById(req.params.id);

    if (!record) {
      res.status(404);
      throw new Error('Stock In record not found');
    }

    await StockIn.findByIdAndDelete(req.params.id);
    res.json({ message: 'Stock In record removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
