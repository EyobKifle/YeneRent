import express from 'express';
import { body, validationResult } from 'express-validator';
import { authorizeRoles } from '../middleware/roles.js';
import Unit from '../models/Unit.js';

const router = express.Router();

// GET /api/units - Get all units
router.get('/', async (req, res) => {
  try {
    const units = await Unit.find()
      .populate('propertyId', 'name address')
      .sort({ createdAt: -1 });
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// GET /api/units/:id - Get a specific unit
router.get('/:id', async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate('propertyId', 'name address');
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid unit ID' });
    }
    res.status(500).json({ error: 'Failed to fetch unit' });
  }
});

// GET /api/units/property/:propertyId - Get units for a specific property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const units = await Unit.find({ propertyId: req.params.propertyId })
      .sort({ unitNumber: 1 });
    res.json(units);
  } catch (error) {
    console.error('Error fetching units for property:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// POST /api/units - Create a new unit
 
router.post('/', authorizeRoles('admin','owner','customer','property_manager'), [
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('unitNumber').trim().isLength({ min: 1 }).withMessage('Unit number is required'),
  body('rent').optional().isNumeric().withMessage('Rent must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const unit = new Unit(req.body);
    await unit.save();
    await unit.populate('propertyId', 'name address');
    res.status(201).json(unit);
  } catch (error) {
    console.error('Error creating unit:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Unit number already exists for this property' });
    }
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// PUT /api/units/:id - Update a unit
router.put('/:id', [
  body('propertyId').optional().isMongoId().withMessage('Valid property ID is required'),
  body('unitNumber').optional().trim().isLength({ min: 1 }).withMessage('Unit number cannot be empty'),
  body('rent').optional().isNumeric().withMessage('Rent must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('propertyId', 'name address');

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json(unit);
  } catch (error) {
    console.error('Error updating unit:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid unit ID' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Unit number already exists for this property' });
    }
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// DELETE /api/units/:id - Delete a unit
router.delete('/:id', async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid unit ID' });
    }
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

export default router;
