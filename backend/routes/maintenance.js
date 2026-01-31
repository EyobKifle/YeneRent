import express from 'express';
import { body, validationResult } from 'express-validator';
import Maintenance from '../models/Maintenance.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/maintenance - Get all maintenance requests
router.get('/', async (req, res) => {
  try {
    const { propertyId, unitId, status, category } = req.query;
    let query = {};

    // Filter based on user role
    if (req.user.role === 'tenant') {
      // Tenants can only see maintenance requests for their leased units
      // For now, allow all - this could be enhanced to filter by leased units
    } else if (req.user.role === 'property_manager') {
      // Property managers can see maintenance for properties they manage
      // For now, allow all - this could be enhanced to filter by managed properties
    }
    // Admins, owners, and customers can see all maintenance requests

    if (propertyId) query.propertyId = propertyId;
    if (unitId) query.unitId = unitId;
    if (status) query.status = status;
    if (category) query.category = category;

    const maintenance = await Maintenance.find(query)
      .populate('propertyId', 'name address')
      .populate('unitId', 'unitNumber')
      .populate('assignedTo', 'name email')
      .sort({ reportedDate: -1 });
    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
});

// GET /api/maintenance/:id - Get a specific maintenance request
router.get('/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('propertyId', 'name address')
      .populate('unitId', 'unitNumber')
      .populate('assignedTo', 'name email');
    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }
    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid maintenance ID' });
    }
    res.status(500).json({ error: 'Failed to fetch maintenance request' });
  }
});

// GET /api/maintenance/property/:propertyId - Get maintenance for a specific property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const maintenance = await Maintenance.find({ propertyId: req.params.propertyId })
      .populate('unitId', 'unitNumber')
      .sort({ reportedDate: -1 });
    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance for property:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
});

// POST /api/maintenance - Create a new maintenance request
router.post('/', authorizeRoles('admin','property_manager','tenant','owner','customer'), [
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('category').isIn(['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Appliance', 'Cleaning', 'Security', 'Other']).withMessage('Invalid category'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
  body('status').isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('reportedDate').isISO8601().withMessage('Valid reported date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const maintenance = new Maintenance(req.body);
    await maintenance.save();
    await maintenance.populate('propertyId', 'name address');
    await maintenance.populate('unitId', 'unitNumber');
    await maintenance.populate('assignedTo', 'name email');
    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ error: 'Failed to create maintenance request' });
  }
});

// PUT /api/maintenance/:id - Update a maintenance request
router.put('/:id', [
  body('propertyId').optional().isMongoId().withMessage('Valid property ID is required'),
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('category').optional().isIn(['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Appliance', 'Cleaning', 'Security', 'Other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('reportedDate').optional().isISO8601().withMessage('Valid reported date is required'),
  body('cost').optional().isNumeric().withMessage('Cost must be a number'),
  body('assignedTo').optional().isMongoId().withMessage('Valid assigned user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('propertyId', 'name address')
     .populate('unitId', 'unitNumber')
     .populate('assignedTo', 'name email');

    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid maintenance ID' });
    }
    res.status(500).json({ error: 'Failed to update maintenance request' });
  }
});

// DELETE /api/maintenance/:id - Delete a maintenance request
router.delete('/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }
    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid maintenance ID' });
    }
    res.status(500).json({ error: 'Failed to delete maintenance request' });
  }
});

// Static lists
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      'Plumbing', 'Electrical', 'HVAC', 'Structural',
      'Appliance', 'Cleaning', 'Security', 'Other'
    ];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/priorities/list', async (req, res) => {
  try {
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    res.json(priorities);
  } catch (error) {
    console.error('Error fetching priorities:', error);
    res.status(500).json({ error: 'Failed to fetch priorities' });
  }
});

router.get('/statuses/list', async (req, res) => {
  try {
    const statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

export default router;
