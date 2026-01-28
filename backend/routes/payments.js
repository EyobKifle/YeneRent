import express from 'express';
import { body, validationResult } from 'express-validator';
import Payment from '../models/Payment.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/payments - Get all payments
router.get('/', async (req, res) => {
  try {
    const { status, tenantId, leaseId, startDate, endDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (tenantId) query.tenantId = tenantId;
    if (leaseId) query.leaseId = leaseId;
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('leaseId', 'startDate endDate')
      .populate('tenantId', 'name email')
      .populate('propertyId', 'name address')
      .sort({ dueDate: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/:id - Get a specific payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('leaseId', 'startDate endDate')
      .populate('tenantId', 'name email')
      .populate('propertyId', 'name address');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// GET /api/payments/lease/:leaseId - Get payments for a specific lease
router.get('/lease/:leaseId', async (req, res) => {
  try {
    const payments = await Payment.find({ leaseId: req.params.leaseId })
      .populate('leaseId', 'startDate endDate')
      .populate('tenantId', 'name email')
      .populate('propertyId', 'name address')
      .sort({ dueDate: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments for lease:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/payments - Create a new payment
router.post('/', authorizeRoles('admin','property_manager'), [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
  body('leaseId').isMongoId().withMessage('Invalid lease ID'),
  body('tenantId').isMongoId().withMessage('Invalid tenant ID'),
  body('propertyId').isMongoId().withMessage('Invalid property ID'),
  body('method').isIn(['Bank Transfer', 'Cash', 'CBE Birr', 'Dashen Bank', 'Awash International Bank', 'Other']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = new Payment(req.body);
    await payment.save();
    await payment.populate('leaseId', 'startDate endDate');
    await payment.populate('tenantId', 'name email');
    await payment.populate('propertyId', 'name address');
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// PUT /api/payments/:id - Update a payment
router.put('/:id', authorizeRoles('admin','property_manager'), [
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('leaseId').optional().isMongoId().withMessage('Invalid lease ID'),
  body('tenantId').optional().isMongoId().withMessage('Invalid tenant ID'),
  body('propertyId').optional().isMongoId().withMessage('Invalid property ID'),
  body('type').optional().isIn(['Rent', 'Deposit', 'Late Fee', 'Maintenance', 'Utility', 'Other']).withMessage('Invalid payment type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('leaseId', 'startDate endDate')
     .populate('tenantId', 'name email')
     .populate('propertyId', 'name address');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// DELETE /api/payments/:id - Delete a payment
router.delete('/:id', authorizeRoles('admin','property_manager'), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// GET /api/payments/overdue - Get overdue payments
router.get('/overdue/list', async (req, res) => {
  try {
    const currentDate = new Date();
    const { days = 30 } = req.query;

    // Calculate date threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(currentDate.getDate() - parseInt(days));

    const overduePayments = await Payment.find({
      dueDate: { $lt: currentDate },
      status: { $in: ['Pending', 'Overdue'] }
    })
    .populate('leaseId', 'startDate endDate rentAmount')
    .populate('tenantId', 'name email phone')
    .populate('propertyId', 'name address')
    .sort({ dueDate: 1 });

    // Calculate additional metrics
    const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const criticalOverdue = overduePayments.filter(payment => {
      const daysOverdue = Math.floor((currentDate - payment.dueDate) / (1000 * 60 * 60 * 24));
      return daysOverdue > 60; // More than 60 days overdue
    });

    res.json({
      payments: overduePayments,
      summary: {
        totalCount: overduePayments.length,
        totalAmount: totalOverdue,
        criticalCount: criticalOverdue.length,
        averageDaysOverdue: overduePayments.length > 0 ?
          overduePayments.reduce((sum, payment) => {
            const days = Math.floor((currentDate - payment.dueDate) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / overduePayments.length : 0
      }
    });
  } catch (error) {
    console.error('Error fetching overdue payments:', error);
    res.status(500).json({ error: 'Failed to fetch overdue payments' });
  }
});

// GET /api/payments/analytics - Get payment analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;

    // Set default date range (current month)
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    let matchQuery = {
      date: { $gte: start, $lte: end }
    };

    if (propertyId) {
      matchQuery.propertyId = propertyId;
    }

    const analytics = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0]
            }
          },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Overdue'] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    // Get payment method distribution
    const methodDistribution = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Get monthly trends
    const monthlyTrends = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const result = analytics[0] || {
      totalPayments: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0
    };

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      summary: {
        totalPayments: result.totalPayments,
        totalAmount: Math.round(result.totalAmount),
        paidAmount: Math.round(result.paidAmount),
        pendingAmount: Math.round(result.pendingAmount),
        overdueAmount: Math.round(result.overdueAmount),
        collectionRate: result.totalAmount > 0 ?
          Math.round((result.paidAmount / result.totalAmount) * 100 * 100) / 100 : 0
      },
      distributions: {
        byMethod: methodDistribution
      },
      trends: monthlyTrends.map(trend => ({
        month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
        totalAmount: Math.round(trend.totalAmount),
        paidAmount: Math.round(trend.paidAmount),
        count: trend.count
      }))
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
});

// POST /api/payments/generate - Generate payments for active leases
router.post('/generate/monthly', authorizeRoles('admin','property_manager'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Find all active leases
    const activeLeases = await Lease.find({
      startDate: { $lte: new Date(targetYear, targetMonth, 0) },
      endDate: { $gte: new Date(targetYear, targetMonth - 1, 1) }
    }).populate('tenantId unitId propertyId');

    const generatedPayments = [];
    const existingPayments = [];

    for (const lease of activeLeases) {
      // Check if payment already exists for this month
      const existingPayment = await Payment.findOne({
        leaseId: lease._id,
        dueDate: {
          $gte: new Date(targetYear, targetMonth - 1, 1),
          $lt: new Date(targetYear, targetMonth, 1)
        }
      });

      if (existingPayment) {
        existingPayments.push(existingPayment);
        continue;
      }

      // Calculate due date (1st of the month)
      const dueDate = new Date(targetYear, targetMonth - 1, 1);

      // Create new payment
      const payment = new Payment({
        leaseId: lease._id,
        tenantId: lease.tenantId._id,
        propertyId: lease.propertyId._id,
        amount: lease.rentAmount,
        dueDate: dueDate,
        type: 'Rent'
      });

      await payment.save();
      generatedPayments.push(payment);
    }

    res.json({
      message: `Generated ${generatedPayments.length} payments, ${existingPayments.length} already existed`,
      generated: generatedPayments.length,
      existing: existingPayments.length,
      payments: generatedPayments
    });
  } catch (error) {
    console.error('Error generating monthly payments:', error);
    res.status(500).json({ error: 'Failed to generate monthly payments' });
  }
});

export default router;
