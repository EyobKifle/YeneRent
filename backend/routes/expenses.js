import express from 'express';
import { body, validationResult } from 'express-validator';
import Expense from '../models/Expense.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/expenses - Get all expenses
router.get('/', async (req, res) => {
  try {
    const { propertyId, category, startDate, endDate } = req.query;
    let query = {};

    if (propertyId) query.propertyId = propertyId;
    if (category) query.category = category;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const expenses = await Expense.find(query)
      .populate('propertyId', 'name address')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/:id - Get a specific expense
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('propertyId', 'name address');
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// GET /api/expenses/property/:propertyId - Get expenses for a specific property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const expenses = await Expense.find({ propertyId: req.params.propertyId })
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses for property:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses - Create a new expense
router.post('/', authorizeRoles('admin','property_manager','customer'), [
  body('propertyId').isMongoId().withMessage('Valid property ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('category').isIn(['Utilities', 'Salaries', 'Supplies', 'Marketing', 'Insurance', 'Property Tax', 'Maintenance', 'Repairs', 'Other']).withMessage('Invalid category'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = new Expense(req.body);
    await expense.save();
    await expense.populate('propertyId', 'name address');
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id - Update an expense
router.put('/:id', authorizeRoles('admin','property_manager','customer','tenant'), [
  body('propertyId').optional().isMongoId().withMessage('Valid property ID is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('category').optional().isIn(['Utilities', 'Salaries', 'Supplies', 'Marketing', 'Insurance', 'Property Tax', 'Maintenance', 'Repairs', 'Other']).withMessage('Invalid category'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('propertyId', 'name address');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', authorizeRoles('admin','property_manager','customer','tenant'), async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// GET /api/expenses/categories - Get expense categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      'Utilities', 'Salaries', 'Supplies', 'Marketing',
      'Insurance', 'Property Tax', 'Maintenance', 'Repairs', 'Other'
    ];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
