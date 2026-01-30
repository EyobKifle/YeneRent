import express from 'express';
import { body, validationResult } from 'express-validator';
import Lease from '../models/Lease.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/leases - Get all leases
router.get('/', async (req, res) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user.role === 'tenant') {
      // Tenants can only see their own leases
      query.tenantId = req.user.userId;
    } else if (req.user.role === 'property_manager') {
      // Property managers can see leases for properties they manage
      // For now, allow all - this could be enhanced to filter by managed properties
    }
    // Admins, owners, and customers can see all leases

    const leases = await Lease.find(query)
      .populate('tenantId', 'name email phone')
      .populate('unitId', 'unitNumber')
      .populate('propertyId', 'name address')
      .sort({ createdAt: -1 });
    res.json(leases);
  } catch (error) {
    console.error('Error fetching leases:', error);
    res.status(500).json({ error: 'Failed to fetch leases' });
  }
});

// GET /api/leases/:id - Get a specific lease
router.get('/:id', async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('tenantId', 'name email phone')
      .populate('unitId', 'unitNumber')
      .populate('propertyId', 'name address');
    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }
    res.json(lease);
  } catch (error) {
    console.error('Error fetching lease:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid lease ID' });
    }
    res.status(500).json({ error: 'Failed to fetch lease' });
  }
});

// GET /api/leases/tenant/:tenantId - Get leases for a specific tenant
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const leases = await Lease.find({ tenantId: req.params.tenantId })
      .populate('unitId', 'unitNumber')
      .populate('propertyId', 'name address')
      .sort({ startDate: -1 });
    res.json(leases);
  } catch (error) {
    console.error('Error fetching leases for tenant:', error);
    res.status(500).json({ error: 'Failed to fetch leases' });
  }
});

// POST /api/leases - Create a new lease
router.post('/', authorizeRoles('admin','property_manager'), [
  body('tenantId').isMongoId().withMessage('Valid tenant ID is required'),
  body('unitId').isMongoId().withMessage('Valid unit ID is required'),
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('rentAmount').isNumeric().withMessage('Rent amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if unit is already leased for the given period
    const existingLease = await Lease.findOne({
      unitId: req.body.unitId,
      $or: [
        {
          $and: [
            { startDate: { $lte: new Date(req.body.startDate) } },
            { endDate: { $gte: new Date(req.body.startDate) } }
          ]
        },
        {
          $and: [
            { startDate: { $lte: new Date(req.body.endDate) } },
            { endDate: { $gte: new Date(req.body.endDate) } }
          ]
        }
      ]
    });

    if (existingLease) {
      return res.status(400).json({ error: 'Unit is already leased for the specified period' });
    }

    const lease = new Lease(req.body);
    await lease.save();
    await lease.populate('tenantId', 'name email phone');
    await lease.populate('unitId', 'unitNumber');
    await lease.populate('propertyId', 'name address');
    res.status(201).json(lease);
  } catch (error) {
    console.error('Error creating lease:', error);
    res.status(500).json({ error: 'Failed to create lease' });
  }
});

// PUT /api/leases/:id - Update a lease
router.put('/:id', authorizeRoles('admin','property_manager'), [
  body('tenantId').optional().isMongoId().withMessage('Valid tenant ID is required'),
  body('unitId').optional().isMongoId().withMessage('Valid unit ID is required'),
  body('propertyId').optional().isMongoId().withMessage('Valid property ID is required'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('rentAmount').optional().isNumeric().withMessage('Rent amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const lease = await Lease.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('tenantId', 'name email phone')
     .populate('unitId', 'unitNumber')
     .populate('propertyId', 'name address');

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    res.json(lease);
  } catch (error) {
    console.error('Error updating lease:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid lease ID' });
    }
    res.status(500).json({ error: 'Failed to update lease' });
  }
});

// DELETE /api/leases/:id - Delete a lease
router.delete('/:id', authorizeRoles('admin','property_manager'), async (req, res) => {
  try {
    const lease = await Lease.findByIdAndDelete(req.params.id);
    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }
    res.json({ message: 'Lease deleted successfully' });
  } catch (error) {
    console.error('Error deleting lease:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid lease ID' });
    }
    res.status(500).json({ error: 'Failed to delete lease' });
  }
});

export default router;
