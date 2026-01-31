import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['Rent', 'Deposit', 'Late Fee', 'Maintenance', 'Utility', 'Other'],
    default: 'Rent'
  },
  withholdingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['Bank Transfer', 'Cash', 'CBE Birr', 'Dashen Bank', 'Awash International Bank', 'Other']
  },
  status: {
    type: String,
    required: true,
    enum: ['Paid', 'Pending', 'Overdue', 'Failed'],
    default: 'Pending'
  },
  receiptUrl: {
    type: String,
    default: null
  },
  receiptName: {
    type: String,
    default: null
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  lateFee: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// Index for efficient queries
paymentSchema.index({ leaseId: 1, date: -1 });
paymentSchema.index({ tenantId: 1, status: 1 });
paymentSchema.index({ dueDate: 1 });

export default mongoose.model('Payment', paymentSchema);
