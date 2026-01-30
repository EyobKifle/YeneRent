import express from 'express';
import { body, validationResult } from 'express-validator';
import Tenant from '../models/Tenant.js';

const router = express.Router();

// GET /api/tenants - Get all tenants
router.get('/', async (req, res) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user.role === 'tenant') {
      // Tenants can only see their own record
      query._id = req.user.userId;
    } else if (req.user.role === 'property_manager') {
      // Property managers can see tenants for properties they manage
      // For now, allow all - this could be enhanced to filter by managed properties
    }
    // Admins, owners, and customers can see all tenants

    const tenants = await Tenant.find(query)
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

// GET /api/tenants/stats - Get tenant statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { propertyId } = req.query;

    let matchQuery = {};
    if (propertyId) {
      // For property-specific stats, we need to filter tenants by their units
      matchQuery = {
        unitId: { $exists: true, $ne: null }
      };
    }

    const stats = await Tenant.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'units',
          localField: 'unitId',
          foreignField: '_id',
          as: 'unit'
        }
      },
      {
        $unwind: {
          path: '$unit',
          preserveNullAndEmptyArrays: true
        }
      },
      ...(propertyId ? [
        {
          $match: {
            'unit.propertyId': propertyId
          }
        }
      ] : []),
      {
        $group: {
          _id: null,
          totalTenants: { $sum: 1 },
          activeTenants: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          formerTenants: {
            $sum: {
              $cond: [{ $eq: ['$status', 'former'] }, 1, 0]
            }
          },
          inactiveTenants: {
            $sum: {
              $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get tenant status distribution
    const statusDistribution = await Tenant.aggregate([
      { $match: matchQuery },
      ...(propertyId ? [
        {
          $lookup: {
            from: 'units',
            localField: 'unitId',
            foreignField: '_id',
            as: 'unit'
          }
        },
        {
          $unwind: {
            path: '$unit',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            'unit.propertyId': propertyId
          }
        }
      ] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get tenants by move-in year
    const moveInTrends = await Tenant.aggregate([
      { $match: matchQuery },
      ...(propertyId ? [
        {
          $lookup: {
            from: 'units',
            localField: 'unitId',
            foreignField: '_id',
            as: 'unit'
          }
        },
        {
          $unwind: {
            path: '$unit',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            'unit.propertyId': propertyId
          }
        }
      ] : []),
      {
        $match: {
          moveInDate: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: { $year: '$moveInDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const result = stats[0] || {
      totalTenants: 0,
      activeTenants: 0,
      formerTenants: 0,
      inactiveTenants: 0
    };

    res.json({
      overview: {
        totalTenants: result.totalTenants,
        activeTenants: result.activeTenants,
        formerTenants: result.formerTenants,
        inactiveTenants: result.inactiveTenants,
        occupancyRate: result.totalTenants > 0 ?
          Math.round((result.activeTenants / result.totalTenants) * 100 * 100) / 100 : 0
      },
      distributions: {
        byStatus: statusDistribution
      },
      trends: {
        moveInByYear: moveInTrends.map(trend => ({
          year: trend._id,
          count: trend.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching tenant stats:', error);
    res.status(500).json({ error: 'Failed to fetch tenant statistics' });
  }
});

export default router;
