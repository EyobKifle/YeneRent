import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Apartment', 'Villa', 'Office', 'Commercial', 'House']
  },
  taxType: {
    type: String,
    required: true,
    enum: ['property-only', 'withholding-annual', 'withholding-property', 'all-taxes']
  },
  rent: {
    type: Number,
    required: true,
    min: 0
  },
  units: {
    type: Number,
    required: true,
    min: 1
  },
  imageUrl: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  amenities: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

export default mongoose.model('Property', propertySchema);
