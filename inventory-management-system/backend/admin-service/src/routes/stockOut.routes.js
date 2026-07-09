import express from 'express';
import Stock from '../models/Stock.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all stock out records
// @route   GET /api/stock-out
// @access  Private (all roles)
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, productId } = req.query;
    const query = { type: 'OUT' };

    if (productId) query.productId = productId;

    if (req.user.role === 'Admin') {
      // Admin sees all records regardless of status, unless a specific status is requested
      if (status && status !== 'all') {
        query.status = status;
      }
    } else {
      // Non-admin users see only Approved records
      query.status = status && status !== 'all' ? status : 'Approved';
    }

    const stock = await Stock.find(query)
      .populate('productId', 'name sku')
      .populate('createdBy', 'name email role')
      .populate('auditHistory.performedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(stock);
  } catch (error) {
    next(error);
  }
});

// @desc    Get a single stock out record by ID
// @route   GET /api/stock-out/:id
// @access  Private (all roles)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, type: 'OUT' })
      .populate('productId', 'name sku price')
      .populate('createdBy', 'name email role')
      .populate('auditHistory.performedBy', 'name email role');

    if (!stock) {
      res.status(404);
      throw new Error('Stock out record not found');
    }

    res.json(stock);
  } catch (error) {
    next(error);
  }
});


// @desc    Create a new Stock Out record
// @route   POST /api/stock-out
// @access  Admin only
router.post('/', protect, authorize('Admin'), async (req, res, next) => {
  try {
    const {
      productId,
      itemType,
      quantity,
      color,
      bale,
      weight,
      customerName,
      invoiceNumber,
      date,
      notes,
    } = req.body;

    const validProductId = productId && productId.trim() !== '' ? productId : undefined;

    if (!quantity || !itemType) {
      res.status(400);
      throw new Error('itemType and quantity are required');
    }

    if (validProductId) {
      const product = await Product.findById(validProductId);
      if (!product) {
        res.status(404);
        throw new Error('Product not found');
      }
      
      if (product.inventoryCount < Number(quantity)) {
        res.status(400);
        throw new Error(`Insufficient stock. Available: ${product.inventoryCount}, Requested: ${quantity}`);
      }
    }

    const stock = await Stock.create({
      type: 'OUT',
      productId: validProductId,
      itemType,
      quantity: Number(quantity),
      color,
      bale,
      weight: weight ? Number(weight) : undefined,
      customerName,
      destination: customerName, // for compatibility
      invoiceNumber,
      date: date || Date.now(),
      notes,
      createdBy: req.user.id,
      status: 'Approved',
      auditHistory: [{
        action: 'CREATE',
        performedBy: req.user.id,
        role: req.user.role,
      }]
    });

    if (validProductId) {
      const delta = -Number(quantity);
      const weightDelta = -1 * (weight ? Number(weight) : 0);
      const baleDelta = -1 * (bale && !isNaN(Number(bale)) ? Number(bale) : 0);
      
      await Product.findByIdAndUpdate(validProductId, {
        $inc: { 
          inventoryCount: delta,
          totalWeight: weightDelta,
          totalBales: baleDelta
        },
      });
    }

    const populated = await Stock.findById(stock._id)
      .populate('productId', 'name sku')
      .populate('createdBy', 'name email role')
      .populate('auditHistory.performedBy', 'name email role');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// @desc    Update stock out record
// @route   PUT /api/stock-out/:id
// @access  Admin only
router.put('/:id', protect, authorize('Admin'), async (req, res, next) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      res.status(404);
      throw new Error('Stock record not found');
    }
    
    if (stock.type !== 'OUT') {
      res.status(400);
      throw new Error('Can only edit OUT records via this endpoint');
    }

    const oldQuantity = stock.quantity;
    const oldWeight = stock.weight ? Number(stock.weight) : 0;
    const oldBale = (stock.bale && !isNaN(Number(stock.bale))) ? Number(stock.bale) : 0;

    const {
      quantity,
      color,
      bale,
      weight,
      customerName,
      invoiceNumber,
      date,
      notes,
    } = req.body;

    if (stock.status === 'Approved' && stock.productId) {
      const newQuantity = quantity !== undefined ? Number(quantity) : oldQuantity;
      const newWeight = weight !== undefined ? Number(weight) : oldWeight;
      const newBale = bale !== undefined ? Number(bale) : oldBale;

      const delta = -(newQuantity - oldQuantity);
      const weightDelta = -(newWeight - oldWeight);
      const baleDelta = -(newBale - oldBale);

      if (delta !== 0 || weightDelta !== 0 || baleDelta !== 0) {
        // Prevent negative stock
        const product = await Product.findById(stock.productId);
        if (product.inventoryCount + delta < 0) {
           res.status(400);
           throw new Error(`Insufficient stock for this edit. Available: ${product.inventoryCount}, Requested difference: ${-delta}`);
        }

        await Product.findByIdAndUpdate(stock.productId, {
          $inc: {
            inventoryCount: delta,
            totalWeight: weightDelta,
            totalBales: baleDelta
          },
        });
      }
    }

    if (quantity) stock.quantity = Number(quantity);
    if (color !== undefined) stock.color = color;
    if (bale !== undefined) stock.bale = bale;
    if (weight !== undefined) stock.weight = weight ? Number(weight) : undefined;
    if (customerName !== undefined) {
      stock.customerName = customerName;
      stock.destination = customerName;
    }
    if (invoiceNumber !== undefined) stock.invoiceNumber = invoiceNumber;
    if (date !== undefined) stock.date = date;
    if (notes !== undefined) stock.notes = notes;

    stock.updatedBy = req.user.id;
    stock.auditHistory.push({
      action: 'UPDATE',
      performedBy: req.user.id,
      role: req.user.role,
    });

    const updatedStock = await stock.save();

    const populated = await Stock.findById(updatedStock._id)
      .populate('productId', 'name sku')
      .populate('createdBy', 'name email role')
      .populate('auditHistory.performedBy', 'name email role');

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

// @desc    Delete stock out record
// @route   DELETE /api/stock-out/:id
// @access  Admin only
router.delete('/:id', protect, authorize('Admin'), async (req, res, next) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      res.status(404);
      throw new Error('Stock record not found');
    }

    if (stock.type !== 'OUT') {
      res.status(400);
      throw new Error('Can only delete OUT records via this endpoint');
    }

    if (stock.status === 'Approved' && stock.productId) {
      const reverseDelta = stock.quantity;
      const reverseWeight = stock.weight ? Number(stock.weight) : 0;
      const reverseBale = (stock.bale && !isNaN(Number(stock.bale))) ? Number(stock.bale) : 0;
      
      await Product.findByIdAndUpdate(stock.productId, {
        $inc: { 
          inventoryCount: reverseDelta,
          totalWeight: reverseWeight,
          totalBales: reverseBale
        },
      });
    }

    await Stock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Stock out record removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
