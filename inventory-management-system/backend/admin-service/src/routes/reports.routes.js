import express from 'express';
import Stock from '../models/Stock.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get reports data
// @route   GET /api/reports?type=...
// @access  Admin, Manager
router.get(
  '/',
  protect,
  async (req, res, next) => {
    try {
      const { type, startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      const hasDateFilter = Object.keys(dateFilter).length > 0;

      // 1. Inventory Report (current snapshot)
      if (type === 'inventory' || type === 'item') {
        const products = await Product.find()
          .populate('categoryId', 'name')
          .sort({ name: 1 });
        return res.json(products);
      }

      // 2. Stock In/Out Logs
      if (type === 'stock-in' || type === 'stock-out') {
        const stockType = type === 'stock-in' ? 'IN' : 'OUT';
        const query = { type: stockType, status: 'Approved' };
        if (hasDateFilter) query.date = dateFilter;

        const stocks = await Stock.find(query)
          .populate('productId', 'name sku price')
          .populate('createdBy', 'name')
          .sort({ date: -1 });
        return res.json(stocks);
      }

      // 3. Aggregations (color, bale, weight) for Net Stock
      if (['color', 'bale', 'weight'].includes(type)) {
        const matchStage = { status: 'Approved' };
        if (hasDateFilter) matchStage.date = dateFilter;
        
        // Exclude null/empty fields
        matchStage[type] = { $nin: [null, '', undefined] };

        const agg = await Stock.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: `$${type}`,
              totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
              totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 1,
              totalQuantity: { $subtract: ['$totalIn', '$totalOut'] },
              count: 1
            }
          },
          { $match: { totalQuantity: { $gt: 0 } } },
          { $sort: { totalQuantity: -1 } },
        ]);
        return res.json(agg);
      }

      res.status(400);
      throw new Error(
        'Invalid report type. Use: stock-in, stock-out, inventory, item, color, bale, weight'
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
