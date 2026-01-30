import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Lease Agreement', 'Payment Receipt', 'Tax Document', 'Tenant ID', 'Property Deed', 'Insurance Policy', 'Maintenance Report', 'Other']
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  leaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease',
    default: null
  },
  url: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Update the updatedAt field before saving
documentSchema.pre('save', function(next) {
  // Check if document is expired
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.isExpired = true;
  }
  next();
});

// Index for efficient queries
documentSchema.index({ propertyId: 1, category: 1 });
documentSchema.index({ tenantId: 1, category: 1 });
documentSchema.index({ uploadDate: -1 });

export default mongoose.model('Document', documentSchema);
