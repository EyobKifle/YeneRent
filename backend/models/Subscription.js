import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['basic', 'professional', 'enterprise'], required: true },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['active', 'trial', 'past_due', 'canceled'], default: 'active' },
  nextBillingDate: { type: Date, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  stripeSubscriptionId: { type: String },
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);
