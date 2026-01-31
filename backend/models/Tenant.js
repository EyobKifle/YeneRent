import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    default: null
  },
  moveInDate: {
    type: Date,
    default: null
  },
  moveOutDate: {
    type: Date,
    default: null
  },
  tinNumber: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'former'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  },
  idPhotos: [{
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

export default mongoose.model('Tenant', tenantSchema);
