import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/Property.js';
import Tenant from '../models/Tenant.js';
import Lease from '../models/Lease.js';
import Unit from '../models/Unit.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Maintenance from '../models/Maintenance.js';
import Utility from '../models/Utility.js';
import Document from '../models/Document.js';

dotenv.config();

async function migrateOwnerIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    // 1. Migrate Units - get ownerId from Property
    console.log('\n=== Migrating Units ===');
    const units = await Unit.find({ ownerId: { $exists: false } });
    console.log(`Found ${units.length} units without ownerId`);
    
    for (const unit of units) {
      const property = await Property.findById(unit.propertyId);
      if (property && property.ownerId) {
        unit.ownerId = property.ownerId;
        await unit.save();
        console.log(`✓ Updated unit ${unit.unitNumber} with ownerId from property`);
      } else {
        console.log(`✗ Could not find property or ownerId for unit ${unit.unitNumber}`);
      }
    }

    // 2. Migrate Tenants - get ownerId from Unit's Property
    console.log('\n=== Migrating Tenants ===');
    const tenants = await Tenant.find({ ownerId: { $exists: false } });
    console.log(`Found ${tenants.length} tenants without ownerId`);
    
    for (const tenant of tenants) {
      if (tenant.unitId) {
        const unit = await Unit.findById(tenant.unitId);
        if (unit) {
          const property = await Property.findById(unit.propertyId);
          if (property && property.ownerId) {
            tenant.ownerId = property.ownerId;
            await tenant.save();
            console.log(`✓ Updated tenant ${tenant.name} with ownerId from property`);
          } else {
            console.log(`✗ Could not find property or ownerId for tenant ${tenant.name}`);
          }
        } else {
          console.log(`✗ Could not find unit for tenant ${tenant.name}`);
        }
      } else {
        console.log(`⚠ Tenant ${tenant.name} has no unitId - skipping`);
      }
    }

    // 3. Migrate Leases - get ownerId from Property
    console.log('\n=== Migrating Leases ===');
    const leases = await Lease.find({ ownerId: { $exists: false } });
    console.log(`Found ${leases.length} leases without ownerId`);
    
    for (const lease of leases) {
      const property = await Property.findById(lease.propertyId);
      if (property && property.ownerId) {
        lease.ownerId = property.ownerId;
        await lease.save();
        console.log(`✓ Updated lease with ownerId from property`);
      } else {
        console.log(`✗ Could not find property or ownerId for lease`);
      }
    }

    // 4. Migrate Payments - get ownerId from Property
    console.log('\n=== Migrating Payments ===');
    const payments = await Payment.find({ ownerId: { $exists: false } });
    console.log(`Found ${payments.length} payments without ownerId`);
    
    for (const payment of payments) {
      const property = await Property.findById(payment.propertyId);
      if (property && property.ownerId) {
        payment.ownerId = property.ownerId;
        await payment.save();
        console.log(`✓ Updated payment with ownerId from property`);
      } else {
        console.log(`✗ Could not find property or ownerId for payment`);
      }
    }

    // 5. Migrate Expenses - get ownerId from Property
    console.log('\n=== Migrating Expenses ===');
    const expenses = await Expense.find({ ownerId: { $exists: false } });
    console.log(`Found ${expenses.length} expenses without ownerId`);
    
    for (const expense of expenses) {
      const property = await Property.findById(expense.propertyId);
      if (property && property.ownerId) {
        expense.ownerId = property.ownerId;
        await expense.save();
        console.log(`✓ Updated expense with ownerId from property`);
      } else {
        console.log(`✗ Could not find property or ownerId for expense`);
      }
    }

    // 6. Migrate Maintenance - get ownerId from Property
    console.log('\n=== Migrating Maintenance ===');
    const maintenances = await Maintenance.find({ ownerId: { $exists: false } });
    console.log(`Found ${maintenances.length} maintenance records without ownerId`);
    
    for (const maintenance of maintenances) {
      const property = await Property.findById(maintenance.propertyId);
      if (property && property.ownerId) {
        maintenance.ownerId = property.ownerId;
        await maintenance.save();
        console.log(`✓ Updated maintenance with ownerId from property`);
      } else {
        console.log(`✗ Could not find property or ownerId for maintenance`);
      }
    }

    // 7. Migrate Utilities - get ownerId from Property
    console.log('\n=== Migrating Utilities ===');
    const utilities = await Utility.find({ ownerId: { $exists: false } });
    console.log(`Found ${utilities.length} utility records without ownerId`);
    
    for (const utility of utilities) {
      const property = await Property.findById(utility.propertyId);
      if (property && property.ownerId) {
        utility.ownerId = property.ownerId;
        await utility.save();
        console.log(`✓ Updated utility with ownerId from property`);
      } else {
        console.log(`✗ Could not find property or ownerId for utility`);
      }
    }

    // 8. Migrate Documents - get ownerId from Property or Tenant
    console.log('\n=== Migrating Documents ===');
    const documents = await Document.find({ ownerId: { $exists: false } });
    console.log(`Found ${documents.length} documents without ownerId`);
    
    for (const document of documents) {
      let ownerId = null;
      
      if (document.propertyId) {
        const property = await Property.findById(document.propertyId);
        if (property && property.ownerId) {
          ownerId = property.ownerId;
        }
      } else if (document.tenantId) {
        const tenant = await Tenant.findById(document.tenantId);
        if (tenant && tenant.ownerId) {
          ownerId = tenant.ownerId;
        }
      } else if (document.leaseId) {
        const lease = await Lease.findById(document.leaseId);
        if (lease && lease.ownerId) {
          ownerId = lease.ownerId;
        }
      }
      
      if (ownerId) {
        document.ownerId = ownerId;
        await document.save();
        console.log(`✓ Updated document ${document.name} with ownerId`);
      } else {
        console.log(`✗ Could not determine ownerId for document ${document.name}`);
      }
    }

    console.log('\n=== Migration Complete ===');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateOwnerIds();
