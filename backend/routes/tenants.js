import express from 'express';
import { body, validationResult } from 'express-validator';
import Tenant from '../models/Tenant.js';

const router = express.Router();

// GET /api/tenants - Get all tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate('unitId', 'unitNumber')
      .populate('documents', 'name type category')
      .sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// GET /api/tenants/:id - Get a specific tenant
router.get('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('unitId', 'unitNumber')
      .populate('documents', 'name type category');
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// GET /api/tenants/property/:propertyId - Get tenants for a specific property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate({
        path: 'unitId',
        match: { propertyId: req.params.propertyId },
        select: 'unitNumber'
      })
      .populate('documents', 'name type category')
      .sort({ createdAt: -1 });

    // Filter out tenants without units in the specified property
    const filteredTenants = tenants.filter(tenant => tenant.unitId);
    res.json(filteredTenants);
  } catch (error) {
    console.error('Error fetching tenants for property:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// POST /api/tenants - Create a new tenant
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Tenant name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().isLength({ min: 1 }).withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = new Tenant(req.body);
    await tenant.save();
    await tenant.populate('unitId', 'unitNumber');
    await tenant.populate('documents', 'name type category');
    res.status(201).json(tenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// PUT /api/tenants/:id - Update a tenant
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Tenant name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim().isLength({ min: 1 }).withMessage('Phone number cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('unitId', 'unitNumber').populate('documents', 'name type category');

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// DELETE /api/tenants/:id - Delete a tenant
router.delete('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

export default router;
