import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Storage from '../models/Storage.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// All admin routes require authentication and owner/admin role
router.use(authenticateToken);
router.use(requireRole(['owner', 'admin']));

// GET /admin/overview - Get overview metrics
router.get('/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscribers = await Subscription.countDocuments({ status: 'active' });
    const trialUsers = await Subscription.countDocuments({ status: 'trial' });
    const failedPayments = await Subscription.countDocuments({ status: 'past_due' });
    const totalStorage = await Storage.aggregate([
      { $group: { _id: null, total: { $sum: '$usedStorage' } } }
    ]);
    const mrr = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: { $cond: { if: { $eq: ['$billingCycle', 'monthly'] }, then: '$amount', else: { $divide: ['$amount', 12] } } } } } }
    ]);

    // MRR over last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const mrrHistory = await Subscription.aggregate([
      { $match: { status: 'active', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: { $cond: { if: { $eq: ['$billingCycle', 'monthly'] }, then: '$amount', else: { $divide: ['$amount', 12] } } } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // New users vs churn over last 6 months
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Storage growth over last 6 months
    const storageGrowth = await Storage.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalStorage: { $sum: '$usedStorage' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Alerts
    const expiringTrials = await Subscription.countDocuments({
      status: 'trial',
      endDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // next 7 days
    });
    const nearLimitUsers = await Storage.countDocuments({
      $expr: { $gte: [{ $divide: ['$usedStorage', '$storageLimit'] }, 0.9] }
    });

    res.json({
      totalUsers,
      activeSubscribers,
      trialUsers,
      failedPayments,
      totalStorage: Math.round((totalStorage[0]?.total || 0) / 1073741824 * 100) / 100,
      mrr: Math.round((mrr[0]?.total || 0) * 100) / 100,
      mrrHistory,
      userGrowth,
      storageGrowth,
      alerts: {
        failedPayments,
        expiringTrials,
        nearLimitUsers
      }
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
});

// GET /admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'user',
          as: 'subscription'
        }
      },
      {
        $lookup: {
          from: 'storages',
          localField: '_id',
          foreignField: 'user',
          as: 'storage'
        }
      },
      {
        $addFields: {
          subscriptionStatus: { $ifNull: [{ $arrayElemAt: ['$subscription.status', 0] }, 'none'] },
          storageUsage: { $ifNull: [{ $arrayElemAt: ['$storage.usedStorage', 0] }, 0] },
          storageLimit: { $ifNull: [{ $arrayElemAt: ['$storage.storageLimit', 0] }, 0] }
        }
      },
      {
        $project: {
          password: 0,
          subscription: 0,
          storage: 0
        }
      }
    ]);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /admin/users/:id/role - Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Log the action
    try {
      await AuditLog.create({
        actor: req.user.id,
        action: 'role_changed',
        target: user._id,
        details: { oldRole: user.role, newRole: role },
      });
    } catch (auditError) {
      console.error('Error logging role change:', auditError);
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// PUT /admin/users/:id/status - Suspend/activate user
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Log the action
    try {
      await AuditLog.create({
        actor: req.user.id,
        action: isActive ? 'user_activated' : 'user_suspended',
        target: user._id,
      });
    } catch (auditError) {
      console.error('Error logging user status change:', auditError);
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// GET /admin/subscriptions - Get all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate('user', 'name email');
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// PUT /admin/subscriptions/:id/status - Update subscription status
router.put('/subscriptions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const subscription = await Subscription.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    // Log the action
    try {
      await AuditLog.create({
        actor: req.user.id,
        action: 'subscription_status_changed',
        target: subscription.user,
        details: { subscriptionId: subscription._id, newStatus: status },
      });
    } catch (auditError) {
      console.error('Error logging subscription status change:', auditError);
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error updating subscription status:', error);
    res.status(500).json({ error: 'Failed to update subscription status' });
  }
});

// PUT /admin/subscriptions/:id/retry - Retry payment for subscription
router.put('/subscriptions/:id/retry', async (req, res) => {
  try {
    // This would integrate with Stripe to retry payment
    // For now, just log the action
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    // Log the action
    try {
      await AuditLog.create({
        actor: req.user.id,
        action: 'payment_retry_attempted',
        target: subscription.user,
        details: { subscriptionId: subscription._id },
      });
    } catch (auditError) {
      console.error('Error logging payment retry:', auditError);
    }

    res.json({ message: 'Payment retry initiated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retry payment' });
  }
});

// PUT /admin/subscriptions/:id/upgrade - Upgrade subscription
router.put('/subscriptions/:id/upgrade', async (req, res) => {
  try {
    const { newPlan, newAmount } = req.body;
    const subscription = await Subscription.findByIdAndUpdate(req.params.id, { plan: newPlan, amount: newAmount }, { new: true });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    // Log the action
    try {
      await AuditLog.create({
        actor: req.user.id,
        action: 'subscription_upgraded',
        target: subscription.user,
        details: { subscriptionId: subscription._id, newPlan, newAmount },
      });
    } catch (auditError) {
      console.error('Error logging subscription upgrade:', auditError);
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// PUT /admin/subscriptions/:id/cancel - Cancel subscription
router.put('/subscriptions/:id/cancel', async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(req.params.id, { status: 'canceled' }, { new: true });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    // Log the action
    try {
      await AuditLog.create({
        actor: req.user.id,
        action: 'subscription_canceled',
        target: subscription.user,
        details: { subscriptionId: subscription._id },
      });
    } catch (auditError) {
      console.error('Error logging subscription cancellation:', auditError);
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// GET /admin/storage - Get storage data
router.get('/storage', async (req, res) => {
  try {
    const storage = await Storage.find().populate('user', 'name email');
    const totalStorage = await Storage.aggregate([
      { $group: { _id: null, total: { $sum: '$usedStorage' } } }
    ]);
    const avgPerUser = await Storage.aggregate([
      { $group: { _id: null, avg: { $avg: '$usedStorage' } } }
    ]);
    const topConsumers = await Storage.find()
      .populate('user', 'name email')
      .sort({ usedStorage: -1 })
      .limit(5);
    const nearLimit = await Storage.find({
      $expr: { $gte: [{ $divide: ['$usedStorage', '$storageLimit'] }, 0.9] }
    }).populate('user', 'name email');

    res.json({
      globalOverview: {
        totalUsed: Math.round((totalStorage[0]?.total || 0) / 1073741824 * 100) / 100,
        avgPerUser: Math.round((avgPerUser[0]?.avg || 0) / 1073741824 * 100) / 100,
        topConsumers,
        nearLimit
      },
      perUser: storage
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storage data' });
  }
});

// PUT /admin/storage/:id/limit - Update storage limit
router.put('/storage/:id/limit', async (req, res) => {
  try {
    const { storageLimit } = req.body;
    const storage = await Storage.findByIdAndUpdate(req.params.id, { storageLimit }, { new: true });
    if (!storage) return res.status(404).json({ error: 'Storage record not found' });

    // Log the action
    try {
      await AuditLog.create({
        actor: req.user.id,
        action: 'storage_limit_changed',
        target: storage.user,
        details: { newLimit: storageLimit },
      });
    } catch (auditError) {
      console.error('Error logging storage limit change:', auditError);
    }

    res.json(storage);
  } catch (error) {
    console.error('Error updating storage limit:', error);
    res.status(500).json({ error: 'Failed to update storage limit' });
  }
});

// GET /admin/audit-logs - Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email')
      .populate('target', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
