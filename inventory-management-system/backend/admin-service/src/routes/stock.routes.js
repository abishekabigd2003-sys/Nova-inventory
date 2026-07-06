import express from 'express';
import Stock from '../models/Stock.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// @desc    Get all stock records
// @route   GET /api/stock
// @access  Private (all roles)
// Query: ?type=IN|OUT  ?status=Approved|Pending|Rejected|all  ?productId=xxx
router.get('/', protect, async (req, res, next) => {
  try {
    const { type, status, productId } = req.query;
    const query = {};

    if (type) query.type = type;
    if (productId) query.productId = productId;

    // Non-admins only see Approved records by default
    if (status === 'all' && req.user.role === 'Admin') {
      // no status filter — admin sees all
    } else if (status) {
      query.status = status;
    } else {
      query.status = 'Approved';
    }

    const stock = await Stock.find(query)
      .populate('productId', 'name sku')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(stock);
  } catch (error) {
    next(error);
  }
});

// @desc    Get single stock record
// @route   GET /api/stock/:id
// @access  Private (all roles)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const stock = await Stock.findById(req.params.id)
      .populate('productId', 'name sku price')
      .populate('createdBy', 'name');

    if (!stock) {
      res.status(404);
      throw new Error('Stock record not found');
    }
    res.json(stock);
  } catch (error) {
    next(error);
  }
});

// @desc    Get available stock grouped by attributes
// @route   GET /api/stock/available
// @access  Private (all roles)
router.get('/available', protect, async (req, res, next) => {
  try {
    const pipeline = [
      { $match: { status: 'Approved' } },
      {
        $group: {
          _id: {
            productId: '$productId',
            itemType: '$itemType',
            color: '$color',
            bale: '$bale',
            weight: '$weight'
          },
          totalIn: {
            $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] }
          },
          totalOut: {
            $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] }
          }
        }
      },
      {
        $project: {
          productId: '$_id.productId',
          itemType: '$_id.itemType',
          color: '$_id.color',
          bale: '$_id.bale',
          weight: '$_id.weight',
          netQuantity: { $subtract: ['$totalIn', '$totalOut'] }
        }
      },
      { $match: { netQuantity: { $gt: 0 } } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          productId: 1,
          itemType: 1,
          color: 1,
          bale: 1,
          weight: 1,
          netQuantity: 1,
          productName: { $ifNull: ['$productDetails.name', 'Raw Material'] },
          productSku: { $ifNull: ['$productDetails.sku', 'N/A'] }
        }
      }
    ];

    const availableStock = await Stock.aggregate(pipeline);
    res.json(availableStock);
  } catch (error) {
    next(error);
  }
});

// @desc    Record stock IN or OUT
// @route   POST /api/stock
// @access  Private (all roles)
router.post('/', protect, upload.single('image'), async (req, res, next) => {
  try {
    const {
      type,
      productId,
      itemType,
      quantity,
      color,
      bale,
      weight,
      supplier,
      destination,
      customerName,
      invoiceNumber,
      date,
      notes,
    } = req.body;

    // If productId is empty string, convert to undefined to prevent ObjectId cast errors
    const validProductId = productId && productId.trim() !== '' ? productId : undefined;

    if (!type || !quantity || !itemType) {
      res.status(400);
      throw new Error('type, itemType, and quantity are required');
    }

    if (type !== 'IN') {
      res.status(400);
      throw new Error('This endpoint only handles Stock IN (type IN). Use /api/stock-out for Stock OUT.');
    }

    // Validate product exists if provided
    if (validProductId) {
      const product = await Product.findById(validProductId);
      if (!product) {
        res.status(404);
        throw new Error('Product not found');
      }
    }



    const stock = await Stock.create({
      type,
      productId: validProductId,
      itemType,
      quantity: Number(quantity),
      color,
      bale,
      weight: weight ? Number(weight) : undefined,
      supplier,
      destination,
      customerName,
      invoiceNumber,
      date: date || Date.now(),
      notes,
      imagePath: req.file ? `/uploads/${req.file.filename}` : undefined,
      createdBy: req.user.id,
      status: 'Approved',
    });

    // Update product inventory count directly (no cross-service call) if productId exists
    if (validProductId) {
      const delta = Number(quantity);
      const weightDelta = weight ? Number(weight) : 0;
      const baleDelta = bale && !isNaN(Number(bale)) ? Number(bale) : 0;
      
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
      .populate('createdBy', 'name');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

// @desc    Update stock record (Admin only)
// @route   PUT /api/stock/:id
// @access  Admin
router.put(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const stock = await Stock.findById(req.params.id);
      if (!stock) {
        res.status(404);
        throw new Error('Stock record not found');
      }

      if (stock.type === 'OUT') {
        res.status(400);
        throw new Error('Cannot edit Stock OUT records from this endpoint. Use /api/stock-out');
      }

      const oldQuantity = stock.quantity;
      const oldWeight = stock.weight ? Number(stock.weight) : 0;
      const oldBale = (stock.bale && !isNaN(Number(stock.bale))) ? Number(stock.bale) : 0;

      const {
        quantity,
        color,
        bale,
        weight,
        supplier,
        destination,
        customerName,
        invoiceNumber,
        date,
        notes,
      } = req.body;

      if (quantity) stock.quantity = Number(quantity);
      if (color !== undefined) stock.color = color;
      if (bale !== undefined) stock.bale = bale;
      if (weight !== undefined) stock.weight = weight ? Number(weight) : undefined;
      if (supplier !== undefined) stock.supplier = supplier;
      if (destination !== undefined) stock.destination = destination;
      if (customerName !== undefined) stock.customerName = customerName;
      if (invoiceNumber !== undefined) stock.invoiceNumber = invoiceNumber;
      if (date !== undefined) stock.date = date;
      if (notes !== undefined) stock.notes = notes;

      const updatedStock = await stock.save();

      // Update product inventory counts if quantity/weight/bale changed
      if (stock.status === 'Approved' && stock.productId) {
        const newQuantity = updatedStock.quantity;
        const newWeight = updatedStock.weight ? Number(updatedStock.weight) : 0;
        const newBale = (updatedStock.bale && !isNaN(Number(updatedStock.bale))) ? Number(updatedStock.bale) : 0;

        const delta = stock.type === 'IN' ? (newQuantity - oldQuantity) : -(newQuantity - oldQuantity);
        const weightDelta = stock.type === 'IN' ? (newWeight - oldWeight) : -(newWeight - oldWeight);
        const baleDelta = stock.type === 'IN' ? (newBale - oldBale) : -(newBale - oldBale);

        if (delta !== 0 || weightDelta !== 0 || baleDelta !== 0) {
          await Product.findByIdAndUpdate(stock.productId, {
            $inc: {
              inventoryCount: delta,
              totalWeight: weightDelta,
              totalBales: baleDelta
            },
          });
        }
      }

      const populated = await Stock.findById(updatedStock._id)
        .populate('productId', 'name sku')
        .populate('createdBy', 'name');

      res.json(populated);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete stock record (Admin only) — reverses inventory count
// @route   DELETE /api/stock/:id
// @access  Admin
router.delete(
  '/:id',
  protect,
  authorize('Admin'),
  async (req, res, next) => {
    try {
      const stock = await Stock.findById(req.params.id);
      if (!stock) {
        res.status(404);
        throw new Error('Stock record not found');
      }

      if (stock.type === 'OUT') {
        res.status(400);
        throw new Error('Cannot delete Stock OUT records from this endpoint. Use /api/stock-out');
      }

      // Reverse the inventory effect
      if (stock.status === 'Approved' && stock.productId) {
        const reverseDelta = -stock.quantity;
        const reverseWeight = -1 * (stock.weight ? Number(stock.weight) : 0);
        const reverseBale = -1 * (stock.bale && !isNaN(Number(stock.bale)) ? Number(stock.bale) : 0);
        
        await Product.findByIdAndUpdate(stock.productId, {
          $inc: { 
            inventoryCount: reverseDelta,
            totalWeight: reverseWeight,
            totalBales: reverseBale
          },
        });
      }

      await Stock.findByIdAndDelete(req.params.id);
      res.json({ message: 'Stock record removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
