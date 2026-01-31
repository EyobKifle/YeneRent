import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, enum: ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Appliance', 'Cleaning', 'Security', 'Other'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  reportedDate: { type: Date, required: true },
  completedDate: { type: Date, default: null },
  cost: { type: Number, default: 0, min: 0 },
  notes: { type: String, trim: true },
  receiptUrl: { type: String, default: null },
  receiptName: { type: String, default: null },
  images: [{
    url: { type: String, required: true },
    caption: { type: String, trim: true }
  }]
}, { timestamps: true });

export default mongoose.model('Maintenance', maintenanceSchema);
