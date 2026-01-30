import mongoose from 'mongoose';

const storageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  usedStorage: { type: Number, default: 0 }, // in bytes
  storageLimit: { type: Number, default: 1073741824 }, // 1GB in bytes
  files: [{
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model('Storage', storageSchema);
