import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Dashboard overview (aggregated)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      orders,
      products,
      users,
      currentMonthOrders,
      lastMonthOrders
    ] = await Promise.all([
      Order.find({}).populate('user', 'name').sort({ createdAt: -1 }),
      Product.find({}).sort({ createdAt: -1 }),
      User.find({}).select('-password').sort({ createdAt: -1 }),
      Order.find({ createdAt: { $gte: startOfMonth } }),
      Order.find({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
    ]);

    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalCustomers = users.filter(u => u.role === 'user').length;

    // Revenue should consider all non-cancelled orders
    const revenueEligible = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = revenueEligible.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const currentMonthEligible = currentMonthOrders.filter(o => o.status !== 'cancelled');
    const lastMonthEligible = lastMonthOrders.filter(o => o.status !== 'cancelled');

    const currentMonthRevenue = currentMonthEligible.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const lastMonthRevenue = lastMonthEligible.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const revenueChange = lastMonthRevenue
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const averageOrderValue = totalOrders
      ? Number((orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / totalOrders).toFixed(2))
      : 0;

    const monthlyRevenueMap = revenueEligible.reduce((acc, o) => {
      const month = new Date(o.createdAt).toLocaleString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + (o.totalAmount || 0);
      return acc;
    }, {});

    // Order status distribution across common statuses
    const rawStatusCounts = orders.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const statusDistribution = {
      delivered: rawStatusCounts.delivered || 0,
      processing: rawStatusCounts.processing || 0,
      pending: rawStatusCounts.pending || 0,
      cancelled: rawStatusCounts.cancelled || 0,
      shipped: rawStatusCounts.shipped || 0,
    };

    const productSales = orders.reduce((acc, order) => {
      (order.items || []).forEach(item => {
        const productId = String(item.product);
        acc[productId] = (acc[productId] || 0) + (item.quantity || 0);
      });
      return acc;
    }, {});

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const product = products.find(p => String(p._id) === productId);
        return {
          id: productId,
          name: product?.name || 'Unknown Product',
          quantity,
          revenue: product ? (product.price || 0) * quantity : 0
        };
      });

    const recentOrders = orders.slice(0, 5).map(o => ({
      id: o._id,
      customer: o.user?.name || 'N/A',
      amount: o.totalAmount || 0,
      status: o.status,
      date: o.createdAt
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenue,
          totalProducts,
          totalCustomers,
          pendingOrders,
          completedOrders,
          revenueChange,
          lastMonthRevenue,
          averageOrderValue
        },
        revenueByMonth: monthlyRevenueMap,
        statusDistribution,
        topProducts,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Dashboard aggregation error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard overview' });
  }
});

export default router;


