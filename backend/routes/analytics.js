import express from 'express';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Lease from '../models/Lease.js';
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import TaxCalculator from '../../src/utils/taxCalculator.js';

const router = express.Router();

// @route   GET /api/analytics/financial
// @desc    Get financial analytics and reporting
// @access  Private
router.get('/financial', async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;

    // Set default date range (current month)
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    let paymentQuery = {
      date: { $gte: start, $lte: end },
      status: 'Paid'
    };

    let expenseQuery = {
      date: { $gte: start, $lte: end }
    };

    if (propertyId) {
      paymentQuery.propertyId = propertyId;
      expenseQuery.propertyId = propertyId;
    }

    // Get revenue data
    const payments = await Payment.find(paymentQuery);
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Get expense data
    const expenses = await Expense.find(expenseQuery);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate profit/loss
    const netProfit = totalRevenue - totalExpenses;

    // Get revenue by type
    const revenueByType = payments.reduce((acc, payment) => {
      acc[payment.type] = (acc[payment.type] || 0) + payment.amount;
      return acc;
    }, {});

    // Get expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    // Calculate monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);

      const monthPayments = await Payment.find({
        date: { $gte: monthStart, $lte: monthEnd },
        status: 'Paid',
        ...(propertyId && { propertyId })
      });

      const monthExpenses = await Expense.find({
        date: { $gte: monthStart, $lte: monthEnd },
        ...(propertyId && { propertyId })
      });

      const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        revenue: monthRevenue,
        expenses: monthExpense,
        profit: monthRevenue - monthExpense
      });
    }

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        },
        breakdown: {
          revenueByType,
          expensesByCategory
        },
        trends: monthlyTrends
      }
    });
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/analytics/occupancy
// @desc    Get occupancy rate calculations
// @access  Private
router.get('/occupancy', async (req, res) => {
  try {
    const { propertyId, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    let propertyQuery = {};
    if (propertyId) propertyQuery._id = propertyId;

    // Get all properties
    const properties = await Property.find(propertyQuery);

    const occupancyData = await Promise.all(properties.map(async (property) => {
      // Get all units for this property
      const units = await Unit.find({ propertyId: property._id });

      if (units.length === 0) {
        return {
          propertyId: property._id,
          propertyName: property.name,
          totalUnits: 0,
          occupiedUnits: 0,
          occupancyRate: 0,
          vacantUnits: 0
        };
      }

      // Count occupied units (units with active leases)
      let occupiedUnits = 0;
      for (const unit of units) {
        const activeLease = await Lease.findOne({
          unitId: unit._id,
          startDate: { $lte: targetDate },
          endDate: { $gte: targetDate }
        });

        if (activeLease) {
          occupiedUnits++;
        }
      }

      const totalUnits = units.length;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      return {
        propertyId: property._id,
        propertyName: property.name,
        totalUnits,
        occupiedUnits,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        vacantUnits: totalUnits - occupiedUnits
      };
    }));

    // Calculate overall occupancy
    const totalUnits = occupancyData.reduce((sum, prop) => sum + prop.totalUnits, 0);
    const totalOccupied = occupancyData.reduce((sum, prop) => sum + prop.occupiedUnits, 0);
    const overallOccupancyRate = totalUnits > 0 ? (totalOccupied / totalUnits) * 100 : 0;

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        overall: {
          totalUnits,
          occupiedUnits: totalOccupied,
          occupancyRate: Math.round(overallOccupancyRate * 100) / 100,
          vacantUnits: totalUnits - totalOccupied
        },
        properties: occupancyData
      }
    });
  } catch (error) {
    console.error('Occupancy analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/analytics/taxes
// @desc    Get tax calculations and estimates
// @access  Private
router.get('/taxes', async (req, res) => {
  try {
    const { year, propertyId } = req.query;
    const taxYear = year ? parseInt(year) : new Date().getFullYear();

    // Get revenue data for the year
    let paymentQuery = {
      date: {
        $gte: new Date(taxYear, 0, 1),
        $lt: new Date(taxYear + 1, 0, 1)
      },
      status: 'Paid'
    };

    if (propertyId) paymentQuery.propertyId = propertyId;

    const payments = await Payment.find(paymentQuery);
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Get expense data for the year
    let expenseQuery = {
      date: {
        $gte: new Date(taxYear, 0, 1),
        $lt: new Date(taxYear + 1, 0, 1)
      }
    };

    if (propertyId) expenseQuery.propertyId = propertyId;

    const expenses = await Expense.find(expenseQuery);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Group payments by property for withholding tax
    const paymentsByProperty = payments.reduce((acc, payment) => {
      const propId = payment.propertyId.toString();
      if (!acc[propId]) {
        acc[propId] = {
          totalIncome: 0,
          taxType: 'standard' // Default, can be updated based on property settings
        };
      }
      acc[propId].totalIncome += payment.amount;
      return acc;
    }, {});

    // Initialize tax calculator
    const taxCalculator = new TaxCalculator();

    // Calculate all taxes
    const taxCalculations = taxCalculator.calculateAllTaxes({
      totalRevenue,
      totalExpenses,
      paymentsByProperty,
      expenses
    });

    res.json({
      success: true,
      data: {
        year: taxYear,
        financials: {
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses
        },
        taxes: taxCalculations
      }
    });
  } catch (error) {
    console.error('Tax analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard summary data
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const currentDate = new Date();

    // Get current month financials
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [monthlyRevenue, monthlyExpenses, totalProperties, totalTenants, activeLeases, pendingPayments] = await Promise.all([
      Payment.aggregate([
        { $match: { date: { $gte: monthStart, $lte: monthEnd }, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Property.countDocuments(),
      Lease.distinct('tenantId').then(ids => ids.length),
      Lease.countDocuments({
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      }),
      Payment.countDocuments({
        dueDate: { $lt: currentDate },
        status: { $in: ['Pending', 'Overdue'] }
      })
    ]);

    const revenue = monthlyRevenue[0]?.total || 0;
    const expenses = monthlyExpenses[0]?.total || 0;

    // Get upcoming lease expirations (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringLeases = await Lease.find({
      endDate: { $gte: currentDate, $lte: thirtyDaysFromNow }
    })
    .populate('tenantId', 'name email')
    .populate('propertyId', 'name')
    .populate('unitId', 'unitNumber')
    .sort({ endDate: 1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        financials: {
          monthlyRevenue: revenue,
          monthlyExpenses: expenses,
          monthlyProfit: revenue - expenses
        },
        counts: {
          properties: totalProperties,
          tenants: totalTenants,
          activeLeases: activeLeases,
          pendingPayments: pendingPayments
        },
        alerts: {
          expiringLeases: expiringLeases.map(lease => ({
            id: lease._id,
            tenantName: lease.tenantId?.name,
            propertyName: lease.propertyId?.name,
            unitNumber: lease.unitId?.unitNumber,
            endDate: lease.endDate,
            daysUntilExpiry: Math.ceil((lease.endDate - currentDate) / (1000 * 60 * 60 * 24))
          }))
        }
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// CSV export for payments
router.get('/exports/payments.csv', async (req, res) => {
  try {
    const { startDate, endDate, propertyId, status } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (propertyId) query.propertyId = propertyId;
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('tenantId', 'name email')
      .populate('propertyId', 'name address')
      .populate('leaseId', '_id');

    const rows = [];
    const header = [
      'PaymentDate', 'DueDate', 'Amount', 'Status', 'Type', 'Method',
      'TenantName', 'TenantEmail', 'PropertyName', 'PropertyAddress', 'LeaseId', 'Reference', 'Notes', 'LateFee'
    ];
    rows.push(header.join(','));

    for (const p of payments) {
      const line = [
        p.date ? new Date(p.date).toISOString() : '',
        p.dueDate ? new Date(p.dueDate).toISOString() : '',
        (p.amount ?? ''),
        (p.status ?? ''),
        (p.type ?? ''),
        (p.method ?? ''),
        (p.tenantId?.name ?? ''),
        (p.tenantId?.email ?? ''),
        (p.propertyId?.name ?? ''),
        (p.propertyId?.address ?? ''),
        (p.leaseId?._id ?? ''),
        (p.reference ?? ''),
        (p.notes ?? ''),
        (p.lateFee ?? '')
      ].map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v);
      rows.push(line.join(','));
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export payments CSV error:', error);
    return res.status(500).json({ error: 'Failed to export payments' });
  }
});

// CSV export for expenses
router.get('/exports/expenses.csv', async (req, res) => {
  try {
    const { startDate, endDate, propertyId, category } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (propertyId) query.propertyId = propertyId;
    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .populate('propertyId', 'name address');

    const rows = [];
    const header = [
      'Date', 'Amount', 'Category', 'Description', 'Vendor', 'PropertyName', 'PropertyAddress', 'Notes'
    ];
    rows.push(header.join(','));

    for (const e of expenses) {
      const line = [
        e.date ? new Date(e.date).toISOString() : '',
        (e.amount ?? ''),
        (e.category ?? ''),
        (e.description ?? ''),
        (e.vendor ?? ''),
        (e.propertyId?.name ?? ''),
        (e.propertyId?.address ?? ''),
        (e.notes ?? '')
      ].map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v);
      rows.push(line.join(','));
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export expenses CSV error:', error);
    return res.status(500).json({ error: 'Failed to export expenses' });
  }
});

export default router;
