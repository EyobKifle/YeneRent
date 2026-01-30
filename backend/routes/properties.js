import express from 'express';
import { body, validationResult } from 'express-validator';
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/properties - Get all properties with filtering and search
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      taxType,
      minRent,
      maxRent,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    let query = {};

    // Filter based on user role
    if (req.user.role === 'tenant') {
      // Tenants can only see properties they have leases for
      // For now, allow all - this could be enhanced to filter by leased properties
    } else if (req.user.role === 'property_manager') {
      // Property managers can see properties they manage
      // For now, allow all - this could be enhanced to filter by managed properties
    }
    // Admins, owners, and customers can see all properties

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by tax type
    if (taxType) {
      query.taxType = taxType;
    }

    // Filter by rent range
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = parseFloat(minRent);
      if (maxRent) query.rent.$lte = parseFloat(maxRent);
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const properties = await Property.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Property.countDocuments(query);

    res.json({
      properties,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProperties: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
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
router.post('/', authorizeRoles('owner','admin','property_manager','customer'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Property name is required'),
  body('address').trim().isLength({ min: 1 }).withMessage('Property address is required'),
  body('type').isIn(['Apartment', 'Villa', 'Office', 'Commercial', 'House']).withMessage('Invalid property type'),
  body('taxType').isIn(['property-only', 'withholding-annual', 'withholding-property', 'all-taxes']).withMessage('Invalid tax type'),
  body('rent').isNumeric().withMessage('Rent must be a number'),
  body('units').isArray().withMessage('Units must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { units, ...propertyData } = req.body;
    propertyData.units = units.length; // Set units count

    const property = new Property(propertyData);
    await property.save();

    // Create units
    const createdUnits = [];
    for (const unitData of units) {
      const unit = new Unit({
        ...unitData,
        propertyId: property._id
      });
      await unit.save();
      createdUnits.push(unit);
    }

    res.status(201).json({
      ...property.toObject(),
      createdUnits
    });
  } catch (error) {
    console.error('Error creating property:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Property name already exists' });
    }
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// PUT /api/properties/:id - Update a property
router.put('/:id', authorizeRoles('owner','admin','property_manager'), [
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

// GET /api/properties/stats - Get property statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Property.aggregate([
      {
        $group: {
          _id: null,
          totalProperties: { $sum: 1 },
          totalUnits: { $sum: '$units' },
          averageRent: { $avg: '$rent' },
          minRent: { $min: '$rent' },
          maxRent: { $max: '$rent' },
          totalValue: { $sum: { $multiply: ['$rent', '$units'] } }
        }
      },
      {
        $lookup: {
          from: 'units',
          localField: '_id',
          foreignField: 'propertyId',
          as: 'unitDetails'
        }
      },
      {
        $addFields: {
          occupiedUnits: {
            $size: {
              $filter: {
                input: '$unitDetails',
                cond: { $eq: ['$$this.status', 'Occupied'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $cond: {
              if: { $gt: ['$totalUnits', 0] },
              then: { $multiply: [{ $divide: ['$occupiedUnits', '$totalUnits'] }, 100] },
              else: 0
            }
          }
        }
      }
    ]);

    // Get property type distribution
    const typeDistribution = await Property.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalRent: { $sum: '$rent' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get tax type distribution
    const taxDistribution = await Property.aggregate([
      {
        $group: {
          _id: '$taxType',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = stats[0] || {
      totalProperties: 0,
      totalUnits: 0,
      averageRent: 0,
      minRent: 0,
      maxRent: 0,
      totalValue: 0,
      occupancyRate: 0
    };

    res.json({
      overview: {
        totalProperties: result.totalProperties,
        totalUnits: result.totalUnits,
        averageRent: Math.round(result.averageRent),
        rentRange: {
          min: result.minRent,
          max: result.maxRent
        },
        totalMonthlyValue: Math.round(result.totalValue),
        overallOccupancyRate: Math.round(result.occupancyRate * 100) / 100
      },
      distributions: {
        byType: typeDistribution,
        byTaxType: taxDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching property stats:', error);
    res.status(500).json({ error: 'Failed to fetch property statistics' });
  }
});

export default router;
