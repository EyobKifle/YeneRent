import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lease from '../models/Lease.js';

dotenv.config();

const deleteAllLeases = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev', { autoIndex: true });
    console.log('Connected to MongoDB');

    const result = await Lease.deleteMany({});
    console.log(`Deleted ${result.deletedCount} leases.`);

    await mongoose.disconnect();
    console.log('Disconnected. Lease deletion complete.');
    process.exit(0);
  } catch (err) {
    console.error('Deletion error:', err);
    process.exit(1);
  }
};

deleteAllLeases();
