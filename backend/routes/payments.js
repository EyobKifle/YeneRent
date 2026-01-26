import express from 'express';
import { body, validationResult } from 'express-validator';
import Payment from '../models/Payment.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/payments - Get all payments
router.get('/', async (req, res) => {
  try {
    const { status, tenantId, leaseId, startDate, endDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (tenantId) query.tenantId = tenantId;
    if (leaseId) query.leaseId = leaseId;
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('leaseId', 'startDate endDate')
      .populate('tenantId', 'name email')
      .populate('propertyId', 'name address')
      .sort({ dueDate: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/:id - Get a specific payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('leaseId', 'startDate endDate')
      .populate('tenantId', 'name email')
      .populate('propertyId', 'name address');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// GET /api/payments/lease/:leaseId - Get payments for a specific lease
router.get('/lease/:leaseId', async (req, res) => {
  try {
    const payments = await Payment.find({ leaseId: req.params.leaseId })
      .populate('leaseId', 'startDate endDate')
      .populate('tenantId', 'name email')
      .populate('propertyId', 'name address')
      .sort({ dueDate: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments for lease:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/payments - Create a new payment
router.post('/', authorizeRoles('admin','property_manager'), [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
  body('leaseId').isMongoId().withMessage('Invalid lease ID'),
  body('tenantId').isMongoId().withMessage('Invalid tenant ID'),
  body('propertyId').isMongoId().withMessage('Invalid property ID'),
  body('type').isIn(['Rent', 'Deposit', 'Late Fee', 'Maintenance', 'Utility', 'Other']).withMessage('Invalid payment type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = new Payment(req.body);
    await payment.save();
    await payment.populate('leaseId', 'startDate endDate');
    await payment.populate('tenantId', 'name email');
    await payment.populate('propertyId', 'name address');
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// PUT /api/payments/:id - Update a payment
router.put('/:id', authorizeRoles('admin','property_manager'), [
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('leaseId').optional().isMongoId().withMessage('Invalid lease ID'),
  body('tenantId').optional().isMongoId().withMessage('Invalid tenant ID'),
  body('propertyId').optional().isMongoId().withMessage('Invalid property ID'),
  body('type').optional().isIn(['Rent', 'Deposit', 'Late Fee', 'Maintenance', 'Utility', 'Other']).withMessage('Invalid payment type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('leaseId', 'startDate endDate')
     .populate('tenantId', 'name email')
     .populate('propertyId', 'name address');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// DELETE /api/payments/:id - Delete a payment
router.delete('/:id', authorizeRoles('admin','property_manager'), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

export default router;

export default router;
