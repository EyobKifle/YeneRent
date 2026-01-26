import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  unitNumber: { type: String, required: true, trim: true },
  floor: { type: String, trim: true },
  bedrooms: { type: Number, default: 0 },
  bathrooms: { type: Number, default: 0 },
  size: { type: Number, default: 0 },
  status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' },
  rent: { type: Number, default: 0, min: 0 },
  notes: { type: String, trim: true },
}, { timestamps: true });

unitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });

export default mongoose.model('Unit', unitSchema);
