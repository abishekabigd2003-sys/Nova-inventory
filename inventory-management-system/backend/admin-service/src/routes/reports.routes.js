import express from 'express';
import Stock from '../models/Stock.js';
import StockIn from '../models/StockIn.js';
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

      // 2. Stock In Logs (Uses new StockIn collection)
      if (type === 'stock-in') {
        const query = { status: 'Approved' };
        if (hasDateFilter) query.poDate = dateFilter;

        const stocks = await StockIn.find(query)
          .populate('createdBy', 'name')
          .sort({ poDate: -1 });
        return res.json(stocks);
      }

      // 2.5 Stock Out Logs (Uses Stock collection)
      if (type === 'stock-out') {
        const query = { type: 'OUT', status: 'Approved' };
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
        
        const inMatchStage = { status: 'Approved' };
        if (hasDateFilter) inMatchStage.poDate = dateFilter;
        
        // StockIn model uses 'baleCount' instead of 'bale'
        const inField = type === 'bale' ? 'baleCount' : type;
        inMatchStage[inField] = { $nin: [null, '', undefined] };

        // We run two aggregations in parallel: one for StockIn, one for Stock(OUT)
        const [inAgg, outAgg] = await Promise.all([
          StockIn.aggregate([
            { $match: inMatchStage },
            {
              $group: {
                _id: `$${inField}`,
                totalIn: { $sum: type === 'count' ? 1 : `$${type === 'weight' ? 'weight' : 'baleCount'}` },
                countIn: { $sum: 1 },
              }
            }
          ]),
          Stock.aggregate([
            { $match: { ...matchStage, type: 'OUT' } },
            {
              $group: {
                _id: `$${type}`,
                totalOut: { $sum: `$quantity` },
                countOut: { $sum: 1 },
              }
            }
          ])
        ]);

        // Merge the results
        const merged = {};
        
        inAgg.forEach(item => {
          merged[item._id] = { 
            _id: item._id, 
            totalIn: item.totalIn || 0, 
            totalOut: 0,
            count: item.countIn || 0
          };
        });

        outAgg.forEach(item => {
          if (!merged[item._id]) {
            merged[item._id] = { _id: item._id, totalIn: 0, totalOut: 0, count: 0 };
          }
          merged[item._id].totalOut += item.totalOut || 0;
          merged[item._id].count += item.countOut || 0;
        });

        const result = Object.values(merged)
          .map(item => ({
            _id: item._id,
            totalQuantity: item.totalIn - item.totalOut,
            count: item.count
          }))
          .filter(item => item.totalQuantity > 0)
          .sort((a, b) => b.totalQuantity - a.totalQuantity);

        return res.json(result);
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
