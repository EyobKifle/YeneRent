import express from 'express';
import { body, validationResult } from 'express-validator';
import Utility from '../models/Utility.js';
import Property from '../models/Property.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/utilities - list utilities with optional filters
router.get('/', async (req, res) => {
  try {
    const { propertyId, type, startDate, endDate } = req.query;
    let query = {};

    // Filter based on user role
    // Admins can see all utilities
    // Owners/Customers/PMs can only see utilities for their properties
    if (req.user.role !== 'admin' && req.user.role !== 'tenant') {
       const properties = await Property.find({ ownerId: req.user.userId }).distinct('_id');
       query.propertyId = { $in: properties };
    }

    if (propertyId) query.propertyId = propertyId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const items = await Utility.find(query)
      .populate('propertyId', 'name address')
      .sort({ dueDate: -1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching utilities:', err);
    res.status(500).json({ error: 'Failed to fetch utilities' });
  }
});

// GET /api/utilities/:id - get utility
router.get('/:id', async (req, res) => {
  try {
    const item = await Utility.findById(req.params.id).populate('propertyId', 'name address');
    if (!item) return res.status(404).json({ error: 'Utility not found' });
    res.json(item);
  } catch (err) {
    console.error('Error fetching utility:', err);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid utility ID' });
    res.status(500).json({ error: 'Failed to fetch utility' });
  }
});

// POST /api/utilities - create utility
router.post('/', authorizeRoles('admin','property_manager','customer','tenant'), [
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('type').isIn(['Electricity', 'Water', 'Internet', 'Gas', 'Trash', 'Other']).withMessage('Invalid utility type'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      console.error('Received body:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && req.user.role !== 'tenant') {
      const ownsProperty = await Property.exists({ _id: req.body.propertyId, ownerId: req.user.userId });
      if (!ownsProperty) {
        return res.status(403).json({ error: 'Access denied: You do not own this property' });
      }
    }

    const item = new Utility({
      ...req.body,
      ownerId: req.user.userId
    });
    await item.save();
    await item.populate('propertyId', 'name address');
    res.status(201).json(item);
  } catch (err) {
    console.error('Error creating utility:', err);
    res.status(500).json({ error: 'Failed to create utility' });
  }
});

// PUT /api/utilities/:id - update utility
router.put('/:id', authorizeRoles('admin','property_manager','customer','tenant'), [
  body('propertyId').optional().isMongoId(),
  body('type').optional().isIn(['Electricity', 'Water', 'Internet', 'Gas', 'Trash', 'Other']),
  body('amount').optional().isNumeric(),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    let item;
    if (req.user.role === 'admin') {
      item = await Utility.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('propertyId', 'name address');
    } else {
      item = await Utility.findOneAndUpdate(
        { _id: req.params.id, ownerId: req.user.userId },
        req.body,
        { new: true, runValidators: true }
      ).populate('propertyId', 'name address');
    }

    if (!item) return res.status(404).json({ error: 'Utility not found' });

    res.json(item);
  } catch (err) {
    console.error('Error updating utility:', err);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid utility ID' });
    res.status(500).json({ error: 'Failed to update utility' });
  }
});

// DELETE /api/utilities/:id - delete utility
router.delete('/:id', authorizeRoles('admin','property_manager','customer','tenant'), async (req, res) => {
  try {
    let item;
    if (req.user.role === 'admin') {
      item = await Utility.findByIdAndDelete(req.params.id);
    } else {
      item = await Utility.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId });
    }
    if (!item) return res.status(404).json({ error: 'Utility not found' });
    res.json({ message: 'Utility deleted successfully' });
  } catch (err) {
    console.error('Error deleting utility:', err);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid utility ID' });
    res.status(500).json({ error: 'Failed to delete utility' });
  }
});

export default router;
