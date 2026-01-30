import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'user_created', 'role_changed', 'payment_failed'
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional, the user affected
  details: { type: mongoose.Schema.Types.Mixed }, // additional details
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
