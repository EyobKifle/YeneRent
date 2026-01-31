import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  category: { type: String, enum: ['Maintenance', 'Utilities', 'Taxes', 'Insurance', 'Management', 'Other'], required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  description: { type: String, trim: true },
  vendor: { type: String, trim: true },
  receiptUrl: { type: String, default: null },
  receiptName: { type: String, default: null },
  notes: { type: String, trim: true },
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
