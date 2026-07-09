import express from 'express';
import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import StockIn from '../models/StockIn.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import EditRequest from '../models/EditRequest.js';
import Notification from '../models/Notification.js';
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
        colorBreakdownOut,
        baleBreakdownOut,
        weightBreakdownOut,
        recentStockOut,
        recentRequests,
        unreadNotifications,
        
        // StockIn Queries
        stockInTotal,
        stockInToday,
        monthlyFlowIn,
        colorBreakdownIn,
        baleBreakdownIn,
        weightBreakdownIn,
        recentStockIn
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
          { $match: { status: 'Approved', type: 'OUT' } },
          { $group: { _id: '$type', total: { $sum: '$quantity' } } }
        ]),

        // 4. Today's Stock Flow (In/Out)
        Stock.aggregate([
          { $match: { status: 'Approved', date: { $gte: today }, type: 'OUT' } },
          { $group: { _id: '$type', total: { $sum: '$quantity' } } }
        ]),

        // 5. Edit Request Stats
        EditRequest.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        // 6. Monthly Stock Out (Chart)
        Stock.aggregate([
          { $match: { status: 'Approved', type: 'OUT' } },
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

        // 9. Stock by Color (Chart) - Out
        Stock.aggregate([
          { $match: { status: 'Approved', color: { $ne: null, $ne: '' }, type: 'OUT' } },
          { $group: { _id: '$color', totalOut: { $sum: '$quantity' } } }
        ]),

        // 10. Stock by Bale (Chart) - Out
        Stock.aggregate([
          { $match: { status: 'Approved', bale: { $ne: null, $ne: '' }, type: 'OUT' } },
          { $group: { _id: '$bale', totalOut: { $sum: '$quantity' } } }
        ]),

        // 11. Stock by Weight (Chart) - Out
        Stock.aggregate([
          { $match: { status: 'Approved', weight: { $ne: null }, type: 'OUT' } },
          { $group: { _id: '$weight', totalOut: { $sum: '$quantity' } } }
        ]),

        // 12. Recent Stock Activity (Out)
        Stock.find({ status: 'Approved', type: 'OUT' })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('productId', 'name sku')
          .populate('createdBy', 'name'),

        // 13. Recent Edit Requests / Approvals
        EditRequest.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'name')
          .populate('stockId'),
          
        // 14. Unread Notifications Count
        Notification.countDocuments({ isRead: false }),
        
        // --- StockIn Queries ---
        Stock.aggregate([
          { $match: { status: 'Approved', type: 'IN' } },
          { $group: { _id: 'IN', total: { $sum: '$quantity' } } }
        ]),
        
        Stock.aggregate([
          { $match: { status: 'Approved', type: 'IN', date: { $gte: today } } },
          { $group: { _id: 'IN', total: { $sum: '$quantity' } } }
        ]),
        
        Stock.aggregate([
          { $match: { status: 'Approved', type: 'IN' } },
          {
            $group: {
              _id: { 
                year: { $year: '$date' }, 
                month: { $month: '$date' }, 
                type: 'IN' 
              },
              total: { $sum: '$quantity' }
            }
          }
        ]),
        
        Stock.aggregate([
          { $match: { status: 'Approved', type: 'IN', color: { $ne: null, $ne: '' } } },
          { $group: { _id: '$color', totalIn: { $sum: '$quantity' } } }
        ]),
        
        Stock.aggregate([
          { $match: { status: 'Approved', type: 'IN', bale: { $ne: null, $ne: '' } } },
          { $group: { _id: '$bale', totalIn: { $sum: '$quantity' } } }
        ]),
        
        Stock.aggregate([
          { $match: { status: 'Approved', type: 'IN', weight: { $ne: null } } },
          { $group: { _id: '$weight', totalIn: { $sum: '$quantity' } } }
        ]),
        
        Stock.find({ status: 'Approved', type: 'IN' })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('createdBy', 'name')
      ]);

      // --- Format Data ---
      
      const getStat = (arr, id) => arr?.find(item => item._id === id)?.total || 0;
      const getReqStat = (arr, id) => arr?.find(item => item._id === id)?.count || 0;

      const totalStockIn = getStat(stockInTotal, 'IN');
      const totalStockOut = getStat(stockFlowTotal, 'OUT');

      // Format monthly flow for Recharts
      const monthlyDataMap = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const processMonthly = (flowArray, typeStr) => {
        flowArray.forEach(entry => {
          const key = `${entry._id.year}-${entry._id.month}`;
          if (!monthlyDataMap[key]) {
            monthlyDataMap[key] = {
              name: `${monthNames[entry._id.month - 1]} ${entry._id.year}`,
              'Stock In': 0,
              'Stock Out': 0,
              sortKey: entry._id.year * 100 + entry._id.month
            };
          }
          monthlyDataMap[key][typeStr] += entry.total;
        });
      };
      
      processMonthly(monthlyFlow, 'Stock Out');
      processMonthly(monthlyFlowIn, 'Stock In');

      const monthlyChartData = Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey).slice(-12);

      // Helper to merge aggregation breakdowns (In and Out)
      const mergeBreakdowns = (inArr, outArr) => {
        const map = {};
        inArr.forEach(item => { map[item._id] = { totalIn: item.totalIn || 0, totalOut: 0 }; });
        outArr.forEach(item => {
          if (!map[item._id]) map[item._id] = { totalIn: 0, totalOut: 0 };
          map[item._id].totalOut += item.totalOut || 0;
        });
        return Object.entries(map)
          .map(([key, val]) => ({ name: key, value: val.totalIn - val.totalOut }))
          .filter(x => x.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
      };

      const colorBreakdown = mergeBreakdowns(colorBreakdownIn, colorBreakdownOut);
      const baleBreakdown = mergeBreakdowns(baleBreakdownIn, baleBreakdownOut);
      const weightBreakdown = mergeBreakdowns(weightBreakdownIn, weightBreakdownOut).map(c => ({ name: `${c.name}kg`, value: c.value }));

      // Merge recent stock (In and Out)
      const recentStock = [...recentStockIn.map(s => ({...s._doc, type: 'IN'})), ...recentStockOut.map(s => ({...s._doc, type: 'OUT'}))]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

      res.json({
        kpis: {
          totalProducts,
          totalCategories,
          totalUsers,
          currentInventory: totalStockIn - totalStockOut,
          totalStockIn,
          totalStockOut,
          todayStockIn: getStat(stockInToday, 'IN'),
          todayStockOut: getStat(stockFlowToday, 'OUT'),
          pendingRequests: getReqStat(requestStats, 'Pending'),
          approvedRequests: getReqStat(requestStats, 'Approved'),
          rejectedRequests: getReqStat(requestStats, 'Rejected'),
          unreadNotifications: unreadNotifications,
        },
        alerts: {
          lowStock: inventoryStatus[0].lowStock,
          outOfStock: inventoryStatus[0].outOfStock,
        },
        charts: {
          monthlyFlow: monthlyChartData,
          topProducts,
          categoryBreakdown: categoryBreakdown.map(c => ({ name: c._id || 'Uncategorized', value: c.totalStock })),
          colorBreakdown,
          baleBreakdown,
          weightBreakdown,
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
