import mongoose from 'mongoose';

const leaseSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rentAmount: { type: Number, required: true, min: 0 },
  depositAmount: { type: Number, default: 0, min: 0 },
  paymentSchedule: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' },
  status: { type: String, enum: ['Active', 'Pending', 'Expired', 'Terminated'], default: 'Active' },
  notes: { type: String, trim: true },
  leaseAgreementUrl: { type: String, default: null },
  leaseAgreementName: { type: String, default: null },
  withholdingAmount: { type: Number, default: 0, min: 0 },
  withholdingReceiptUrl: { type: String, default: null },
  withholdingReceiptName: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model('Lease', leaseSchema);
