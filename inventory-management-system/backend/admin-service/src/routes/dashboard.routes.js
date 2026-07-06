import express from 'express';
import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import EditRequest from '../models/EditRequest.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get complete real-time dashboard data
// @route   GET /api/dashboard
// @access  Admin, Manager
router.get(
  '/',
  protect,
  authorize('Admin', 'Manager'),
  async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // --- Execute all queries in parallel for maximum performance ---
      const [
        totalProducts,
        totalCategories,
        totalUsers,
        inventoryStatus,
        stockFlowTotal,
        stockFlowToday,
        requestStats,
        monthlyFlow,
        topProducts,
        categoryBreakdown,
        colorBreakdown,
        baleBreakdown,
        weightBreakdown,
        recentStock,
        recentRequests
      ] = await Promise.all([
        // 1. Basic Counts
        Product.countDocuments(),
        Category.countDocuments(),
        User.countDocuments(),

        // 2. Low / Out of Stock
        Product.aggregate([
          {
            $facet: {
              lowStock: [
                { $match: { $expr: { $lte: ['$inventoryCount', '$minStockLevel'] }, inventoryCount: { $gt: 0 } } },
                { $project: { name: 1, sku: 1, inventoryCount: 1, minStockLevel: 1 } }
              ],
              outOfStock: [
                { $match: { inventoryCount: { $lte: 0 } } },
                { $project: { name: 1, sku: 1, inventoryCount: 1 } }
              ]
            }
          }
        ]),

        // 3. Total Stock Flow (In/Out)
        Stock.aggregate([
          { $match: { status: 'Approved' } },
          { $group: { _id: '$type', total: { $sum: '$quantity' } } }
        ]),

        // 4. Today's Stock Flow (In/Out)
        Stock.aggregate([
          { $match: { status: 'Approved', date: { $gte: today } } },
          { $group: { _id: '$type', total: { $sum: '$quantity' } } }
        ]),

        // 5. Edit Request Stats
        EditRequest.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        // 6. Monthly Stock In vs Out (Chart)
        Stock.aggregate([
          { $match: { status: 'Approved' } },
          {
            $group: {
              _id: { 
                year: { $year: '$date' }, 
                month: { $month: '$date' }, 
                type: '$type' 
              },
              total: { $sum: '$quantity' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),

        // 7. Top Selling Products (Chart/List)
        Stock.aggregate([
          { $match: { type: 'OUT', status: 'Approved' } },
          { $group: { _id: '$productId', totalSold: { $sum: '$quantity' } } },
          { $sort: { totalSold: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: '$product' },
          {
            $project: {
              _id: 1,
              totalSold: 1,
              name: '$product.name',
              sku: '$product.sku',
              inventoryCount: '$product.inventoryCount'
            }
          }
        ]),

        // 8. Stock by Category (Chart)
        Product.aggregate([
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'categoryInfo'
            }
          },
          { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
          { $group: { _id: '$categoryInfo.name', totalStock: { $sum: '$inventoryCount' } } },
          { $sort: { totalStock: -1 } }
        ]),

        // 9. Stock by Color (Chart)
        Stock.aggregate([
          { $match: { status: 'Approved', color: { $ne: null, $ne: '' } } },
          { $group: { 
              _id: '$color', 
              totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
              totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } }
            } 
          },
          { $project: { _id: 1, totalStock: { $subtract: ['$totalIn', '$totalOut'] } } },
          { $match: { totalStock: { $gt: 0 } } },
          { $sort: { totalStock: -1 } },
          { $limit: 10 }
        ]),

        // 10. Stock by Bale (Chart)
        Stock.aggregate([
          { $match: { status: 'Approved', bale: { $ne: null, $ne: '' } } },
          { $group: { 
              _id: '$bale', 
              totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
              totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } }
            } 
          },
          { $project: { _id: 1, totalStock: { $subtract: ['$totalIn', '$totalOut'] } } },
          { $match: { totalStock: { $gt: 0 } } },
          { $sort: { totalStock: -1 } },
          { $limit: 10 }
        ]),

        // 11. Stock by Weight (Chart)
        Stock.aggregate([
          { $match: { status: 'Approved', weight: { $ne: null } } },
          { $group: { 
              _id: '$weight', 
              totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
              totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } }
            } 
          },
          { $project: { _id: 1, totalStock: { $subtract: ['$totalIn', '$totalOut'] } } },
          { $match: { totalStock: { $gt: 0 } } },
          { $sort: { totalStock: -1 } },
          { $limit: 10 }
        ]),

        // 12. Recent Stock Activity
        Stock.find({ status: 'Approved' })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('productId', 'name sku')
          .populate('createdBy', 'name'),

        // 13. Recent Edit Requests / Approvals
        EditRequest.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'name')
          .populate('stockId')
      ]);

      // --- Format Data ---
      
      const getStat = (arr, id) => arr.find(item => item._id === id)?.total || 0;
      const getReqStat = (arr, id) => arr.find(item => item._id === id)?.count || 0;

      const totalStockIn = getStat(stockFlowTotal, 'IN');
      const totalStockOut = getStat(stockFlowTotal, 'OUT');

      // Format monthly flow for Recharts
      const monthlyDataMap = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      monthlyFlow.forEach(entry => {
        const key = `${entry._id.year}-${entry._id.month}`;
        if (!monthlyDataMap[key]) {
          monthlyDataMap[key] = {
            name: `${monthNames[entry._id.month - 1]} ${entry._id.year}`,
            'Stock In': 0,
            'Stock Out': 0,
            sortKey: entry._id.year * 100 + entry._id.month
          };
        }
        monthlyDataMap[key][entry._id.type === 'IN' ? 'Stock In' : 'Stock Out'] = entry.total;
      });

      const monthlyChartData = Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey).slice(-12);

      res.json({
        kpis: {
          totalProducts,
          totalCategories,
          totalUsers,
          currentInventory: totalStockIn - totalStockOut, // Or aggregate total inventoryCount from Products
          totalStockIn,
          totalStockOut,
          todayStockIn: getStat(stockFlowToday, 'IN'),
          todayStockOut: getStat(stockFlowToday, 'OUT'),
          pendingRequests: getReqStat(requestStats, 'Pending'),
          approvedRequests: getReqStat(requestStats, 'Approved'),
          rejectedRequests: getReqStat(requestStats, 'Rejected'),
        },
        alerts: {
          lowStock: inventoryStatus[0].lowStock,
          outOfStock: inventoryStatus[0].outOfStock,
        },
        charts: {
          monthlyFlow: monthlyChartData,
          topProducts,
          categoryBreakdown: categoryBreakdown.map(c => ({ name: c._id || 'Uncategorized', value: c.totalStock })),
          colorBreakdown: colorBreakdown.map(c => ({ name: c._id, value: c.totalStock })),
          baleBreakdown: baleBreakdown.map(c => ({ name: c._id, value: c.totalStock })),
          weightBreakdown: weightBreakdown.map(c => ({ name: `${c._id}kg`, value: c.totalStock })),
        },
        recentActivity: {
          stock: recentStock,
          requests: recentRequests
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
