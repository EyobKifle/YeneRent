import express from 'express';
import { body, validationResult } from 'express-validator';
import Property from '../models/Property.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/properties - Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// GET /api/properties/:id - Get a specific property
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// POST /api/properties - Create a new property
router.post('/', authorizeRoles('admin','property_manager'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Property name is required'),
  body('address').trim().isLength({ min: 1 }).withMessage('Property address is required'),
  body('type').isIn(['Apartment', 'Villa', 'Office', 'Commercial', 'House']).withMessage('Invalid property type'),
  body('taxType').isIn(['property-only', 'withholding-annual', 'withholding-property', 'all-taxes']).withMessage('Invalid tax type'),
  body('rent').isNumeric().withMessage('Rent must be a number'),
  body('units').isNumeric().withMessage('Units must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = new Property(req.body);
    await property.save();
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Property name already exists' });
    }
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// PUT /api/properties/:id - Update a property
router.put('/:id', authorizeRoles('admin','property_manager'), [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Property name cannot be empty'),
  body('address').optional().trim().isLength({ min: 1 }).withMessage('Property address cannot be empty'),
  body('type').optional().isIn(['Apartment', 'Villa', 'Office', 'Commercial', 'House']).withMessage('Invalid property type'),
  body('taxType').optional().isIn(['property-only', 'withholding-annual', 'withholding-property', 'all-taxes']).withMessage('Invalid tax type'),
  body('rent').optional().isNumeric().withMessage('Rent must be a number'),
  body('units').optional().isNumeric().withMessage('Units must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Property name already exists' });
    }
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE /api/properties/:id - Delete a property
router.delete('/:id', authorizeRoles('admin','property_manager'), async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

export default router;
