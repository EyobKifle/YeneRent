import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testAggregation = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev', { autoIndex: true });
    console.log('Connected to MongoDB');

    // Test the aggregation from /admin/users
    const users = await mongoose.connection.db.collection('users').aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'user',
          as: 'subscription'
        }
      },
      {
        $lookup: {
          from: 'storages',
          localField: '_id',
          foreignField: 'user',
          as: 'storage'
        }
      },
      {
        $addFields: {
          subscriptionStatus: { $ifNull: [{ $arrayElemAt: ['$subscription.status', 0] }, 'none'] },
          storageUsage: { $ifNull: [{ $arrayElemAt: ['$storage.usedStorage', 0] }, 0] },
          storageLimit: { $ifNull: [{ $arrayElemAt: ['$storage.storageLimit', 0] }, 0] }
        }
      },
      {
        $project: {
          password: 0,
          subscription: 0,
          storage: 0
        }
      }
    ]).toArray();

    console.log('Users aggregation result:', JSON.stringify(users, null, 2));

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error:', err);
  }
};

testAggregation();
