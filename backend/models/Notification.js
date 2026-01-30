import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema({
  toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['system', 'message', 'alert', 'reminder'], default: 'message' },
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

// Indexes to speed up common queries
notificationSchema.index({ toUser: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Helper method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

export default mongoose.model('Notification', notificationSchema);
