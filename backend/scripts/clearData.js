import mongoose from 'mongoose';
import dotenv from 'dotenv';

import AuditLog from '../models/AuditLog.js';
import Document from '../models/Document.js';
import Expense from '../models/Expense.js';
import Lease from '../models/Lease.js';
import Maintenance from '../models/Maintenance.js';
import Notification from '../models/Notification.js';
import Payment from '../models/Payment.js';
import Property from '../models/Property.js';
import Storage from '../models/Storage.js';
import Subscription from '../models/Subscription.js';
import Tenant from '../models/Tenant.js';
import Unit from '../models/Unit.js';
import Utility from '../models/Utility.js';

dotenv.config();

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev', { autoIndex: true });
    console.log('Connected to MongoDB');

    // Clear all collections except User
    await Promise.all([
      AuditLog.deleteMany({}),
      Document.deleteMany({}),
      Expense.deleteMany({}),
      Lease.deleteMany({}),
      Maintenance.deleteMany({}),
      Notification.deleteMany({}),
      Payment.deleteMany({}),
      Property.deleteMany({}),
      Storage.deleteMany({}),
      Subscription.deleteMany({}),
      Tenant.deleteMany({}),
      Unit.deleteMany({}),
      Utility.deleteMany({}),
    ]);

    console.log('All data cleared except Users.');

    await mongoose.disconnect();
    console.log('Disconnected. Data clearing complete.');
    process.exit(0);
  } catch (err) {
    console.error('Clearing error:', err);
    process.exit(1);
  }
};

clearData();
