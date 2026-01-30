import mongoose from 'mongoose';

const userRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['feature_request', 'bug_report', 'support', 'other'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminResponse: { type: String, trim: true },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: { type: Date },
}, { timestamps: true });

// Indexes for better query performance
userRequestSchema.index({ user: 1, createdAt: -1 });
userRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('UserRequest', userRequestSchema);
