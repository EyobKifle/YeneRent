import mongoose from 'mongoose';

const utilitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Electricity', 'Water', 'Gas', 'Internet', 'Cable TV', 'Trash Collection', 'Security', 'Other']
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    default: null // null means it's for the entire property
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['Unpaid', 'Paid', 'Overdue', 'Pending'],
    default: 'Unpaid'
  },
  billNumber: {
    type: String,
    trim: true
  },
  provider: {
    type: String,
    trim: true
  },
  reading: {
    previous: {
      type: Number,
      default: null,
      min: 0
    },
    current: {
      type: Number,
      default: null,
      min: 0
    },
    unit: {
      type: String,
      trim: true
    }
  },
  receiptUrl: {
    type: String,
    default: null
  },
  receiptName: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
utilitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
utilitySchema.index({ propertyId: 1, status: 1 });
utilitySchema.index({ dueDate: 1 });
utilitySchema.index({ type: 1, propertyId: 1 });

export default mongoose.model('Utility', utilitySchema);
