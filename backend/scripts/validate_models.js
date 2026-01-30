import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import all models
import Property from '../models/Property.js';
import Tenant from '../models/Tenant.js';
import Lease from '../models/Lease.js';
import Payment from '../models/Payment.js';
import Maintenance from '../models/Maintenance.js';
import Unit from '../models/Unit.js';
import Expense from '../models/Expense.js';
import Utility from '../models/Utility.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import Storage from '../models/Storage.js';
import Subscription from '../models/Subscription.js';

const validateModels = async () => {
  console.log('Starting model validation...');

  const models = [
    { name: 'Property', model: Property, sample: { name: 'Test Prop', address: '123 Test St', type: 'Apartment', taxType: 'all-taxes', rent: 1000, units: 1 } },
    { name: 'Tenant', model: Tenant, sample: { name: 'John Doe', email: 'john@example.com', phone: '1234567890' } },
    { name: 'Lease', model: Lease, sample: { tenantId: new mongoose.Types.ObjectId(), unitId: new mongoose.Types.ObjectId(), propertyId: new mongoose.Types.ObjectId(), startDate: new Date(), endDate: new Date(), rentAmount: 1000 } },
    { name: 'Payment', model: Payment, sample: { leaseId: new mongoose.Types.ObjectId(), tenantId: new mongoose.Types.ObjectId(), propertyId: new mongoose.Types.ObjectId(), amount: 1000, type: 'Rent', date: new Date(), dueDate: new Date(), method: 'Cash', status: 'Pending' } },
    { name: 'Maintenance', model: Maintenance, sample: { propertyId: new mongoose.Types.ObjectId(), title: 'Fix leak', category: 'Plumbing', priority: 'High', reportedDate: new Date() } },
    { name: 'Unit', model: Unit, sample: { propertyId: new mongoose.Types.ObjectId(), unitNumber: '101' } },
    { name: 'Expense', model: Expense, sample: { propertyId: new mongoose.Types.ObjectId(), category: 'Maintenance', amount: 50, date: new Date() } },
    { name: 'Utility', model: Utility, sample: { type: 'Water', propertyId: new mongoose.Types.ObjectId(), amount: 100, dueDate: new Date() } },
    { name: 'Document', model: Document, sample: { name: 'Lease.pdf', originalName: 'lease.pdf', type: 'application/pdf', size: 1024, category: 'Lease Agreement', url: 'http://example.com', path: '/tmp/lease.pdf' } },
    { name: 'AuditLog', model: AuditLog, sample: { actor: new mongoose.Types.ObjectId(), action: 'test_action' } },
    { name: 'Storage', model: Storage, sample: { user: new mongoose.Types.ObjectId(), files: [] } },
    { name: 'Subscription', model: Subscription, sample: { user: new mongoose.Types.ObjectId(), plan: 'basic', billingCycle: 'monthly', amount: 10, nextBillingDate: new Date() } }
  ];

  let errors = 0;

  for (const { name, model, sample } of models) {
    try {
      const doc = new model(sample);
      await doc.validate();
      console.log(`✅ ${name} model validation passed`);
    } catch (error) {
      console.error(`❌ ${name} model validation failed:`, error.message);
      errors++;
    }
  }

  if (errors === 0) {
    console.log('\nAll models validated successfully!');
    process.exit(0);
  } else {
    console.error(`\n${errors} models failed validation.`);
    process.exit(1);
  }
};

validateModels();