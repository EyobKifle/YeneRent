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

// GET /api/analytics/search - Global search across multiple collections
router.get('/search/global', async (req, res) => {
  try {
    const { q: searchTerm, limit = 10 } = req.query;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }

    const searchRegex = new RegExp(searchTerm.trim(), 'i');
    const maxLimit = Math.min(parseInt(limit), 50); // Cap at 50 results per collection

    // Search across multiple collections in parallel
    const [properties, tenants, units, leases] = await Promise.all([
      // Search properties
      Property.find({
        $or: [
          { name: searchRegex },
          { address: searchRegex },
          { description: searchRegex }
        ]
      })
      .select('name address type rent')
      .limit(maxLimit)
      .lean(),

      // Search tenants
      Tenant.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      })
      .populate('unitId', 'unitNumber')
      .select('name email phone status')
      .limit(maxLimit)
      .lean(),

      // Search units
      Unit.find({
        $or: [
          { unitNumber: searchRegex },
          { floor: searchRegex },
          { notes: searchRegex }
        ]
      })
      .populate('propertyId', 'name address')
      .select('unitNumber floor status rent propertyId')
      .limit(maxLimit)
      .lean(),

      // Search leases by tenant name (requires lookup)
      Lease.find()
      .populate({
        path: 'tenantId',
        match: {
          $or: [
            { name: searchRegex },
            { email: searchRegex }
          ]
        },
        select: 'name email'
      })
      .populate('propertyId', 'name')
      .populate('unitId', 'unitNumber')
      .select('startDate endDate rentAmount status')
      .limit(maxLimit)
      .lean()
      .then(leases => leases.filter(lease => lease.tenantId)) // Filter out leases without matching tenants
    ]);

    // Format results with metadata
    const results = {
      properties: properties.map(item => ({
        ...item,
        _type: 'property',
        _id: item._id.toString(),
        displayText: `${item.name} - ${item.address}`,
        url: `/properties/${item._id}`
      })),
      tenants: tenants.map(item => ({
        ...item,
        _type: 'tenant',
        _id: item._id.toString(),
        displayText: `${item.name} (${item.email})`,
        unitNumber: item.unitId?.unitNumber,
        url: `/tenants/${item._id}`
      })),
      units: units.map(item => ({
        ...item,
        _type: 'unit',
        _id: item._id.toString(),
        displayText: `Unit ${item.unitNumber} - ${item.propertyId?.name}`,
        propertyName: item.propertyId?.name,
        url: `/units/${item._id}`
      })),
      leases: leases.map(item => ({
        ...item,
        _type: 'lease',
        _id: item._id.toString(),
        displayText: `${item.tenantId?.name} - Unit ${item.unitId?.unitNumber}`,
        tenantName: item.tenantId?.name,
        unitNumber: item.unitId?.unitNumber,
        propertyName: item.propertyId?.name,
        url: `/leases/${item._id}`
      }))
    };

    // Calculate totals
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    res.json({
      query: searchTerm,
      totalResults,
      results,
      metadata: {
        limit: maxLimit,
        collections: ['properties', 'tenants', 'units', 'leases'],
        searchTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/analytics/reports/comprehensive - Comprehensive business report
router.get('/reports/comprehensive', async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get all required data in parallel
    const [
      paymentStats,
      expenseStats,
      occupancyData,
      tenantStats,
      maintenanceStats
    ] = await Promise.all([
      // Payment statistics
      Payment.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            status: 'Paid'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            paymentCount: { $sum: 1 }
          }
        }
      ]),

      // Expense statistics
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            expenseCount: { $sum: 1 }
          }
        }
      ]),

      // Occupancy data
      Unit.aggregate([
        {
          $lookup: {
            from: 'leases',
            let: { unitId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$unitId', '$$unitId'] },
                      { $lte: ['$startDate', endDate] },
                      { $gte: ['$endDate', startDate] }
                    ]
                  }
                }
              }
            ],
            as: 'activeLeases'
          }
        },
        {
          $addFields: {
            isOccupied: { $gt: [{ $size: '$activeLeases' }, 0] }
          }
        },
        {
          $group: {
            _id: '$propertyId',
            totalUnits: { $sum: 1 },
            occupiedUnits: {
              $sum: { $cond: ['$isOccupied', 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'properties',
            localField: '_id',
            foreignField: '_id',
            as: 'property'
          }
        },
        {
          $unwind: '$property'
        }
      ]),

      // Tenant statistics
      Tenant.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Maintenance statistics
      Maintenance.aggregate([
        {
          $match: {
            reportedDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalCost: { $sum: '$cost' }
          }
        }
      ])
    ]);

    // Calculate derived metrics
    const revenue = paymentStats[0]?.totalRevenue || 0;
    const expenses = expenseStats[0]?.totalExpenses || 0;
    const netIncome = revenue - expenses;

    const totalUnits = occupancyData.reduce((sum, prop) => sum + prop.totalUnits, 0);
    const totalOccupied = occupancyData.reduce((sum, prop) => sum + prop.occupiedUnits, 0);
    const overallOccupancy = totalUnits > 0 ? (totalOccupied / totalUnits) * 100 : 0;

    // Format maintenance stats
    const maintenanceSummary = maintenanceStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        totalCost: stat.totalCost
      };
      return acc;
    }, {});

    res.json({
      reportPeriod: {
        month: targetMonth,
        year: targetYear,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      financials: {
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        netIncome: Math.round(netIncome),
        profitMargin: revenue > 0 ? Math.round((netIncome / revenue) * 100 * 100) / 100 : 0
      },
      occupancy: {
        totalUnits,
        occupiedUnits: totalOccupied,
        vacantUnits: totalUnits - totalOccupied,
        occupancyRate: Math.round(overallOccupancy * 100) / 100,
        byProperty: occupancyData.map(prop => ({
          propertyId: prop._id,
          propertyName: prop.property.name,
          totalUnits: prop.totalUnits,
          occupiedUnits: prop.occupiedUnits,
          occupancyRate: prop.totalUnits > 0 ?
            Math.round((prop.occupiedUnits / prop.totalUnits) * 100 * 100) / 100 : 0
        }))
      },
      tenants: {
        byStatus: tenantStats
      },
      maintenance: {
        summary: maintenanceSummary,
        totalRequests: maintenanceStats.reduce((sum, stat) => sum + stat.count, 0),
        totalCost: Math.round(maintenanceStats.reduce((sum, stat) => sum + stat.totalCost, 0))
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Comprehensive report error:', error);
    res.status(500).json({ error: 'Failed to generate comprehensive report' });
  }
});

export default router;
