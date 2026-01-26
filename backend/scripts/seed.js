import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import Tenant from '../models/Tenant.js';
import Lease from '../models/Lease.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Utility from '../models/Utility.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { autoIndex: true });
    console.log('Connected to MongoDB');

    // Clear existing (dev only)
    await Promise.all([
      User.deleteMany({}),
      Property.deleteMany({}),
      Unit.deleteMany({}),
      Tenant.deleteMany({}),
      Lease.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({}),
      Utility.deleteMany({}),
    ]);

    // Users
    const password = await bcrypt.hash('Password123!', parseInt(process.env.BCRYPT_ROUNDS || '10', 10));
    const [admin, manager, tenantUser] = await User.create([
      { name: 'Admin User', email: 'admin@yenerent.test', role: 'admin', password },
      { name: 'Manager User', email: 'manager@yenerent.test', role: 'property_manager', password },
      { name: 'Tenant User', email: 'tenant@yenerent.test', role: 'tenant', password },
    ]);

    // Properties
    const props = await Property.create([
      { name: 'Addis Heights', address: 'Bole, Addis Ababa', type: 'Apartment', taxType: 'all-taxes', rent: 30000, units: 4 },
      { name: 'City View Offices', address: 'Kazanchis, Addis Ababa', type: 'Office', taxType: 'withholding-annual', rent: 60000, units: 3 },
    ]);

    // Units
    const units = await Unit.create([
      { propertyId: props[0]._id, unitNumber: 'A-101', floor: '1', bedrooms: 2, bathrooms: 1, size: 85, rent: 30000 },
      { propertyId: props[0]._id, unitNumber: 'A-102', floor: '1', bedrooms: 3, bathrooms: 2, size: 110, rent: 38000 },
      { propertyId: props[1]._id, unitNumber: 'C-201', floor: '2', bedrooms: 0, bathrooms: 1, size: 60, rent: 45000 },
    ]);

    // Tenants
    const tenants = await Tenant.create([
      { name: 'Selam Tesfaye', email: 'selam@example.com', phone: '+251911000001' },
      { name: 'Dawit Bekele', email: 'dawit@example.com', phone: '+251911000002' },
    ]);

    // Leases
    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(now.getFullYear() + 1);

    const leases = await Lease.create([
      { tenantId: tenants[0]._id, unitId: units[0]._id, propertyId: props[0]._id, startDate: now, endDate: nextYear, rentAmount: 30000, paymentSchedule: 'Monthly' },
      { tenantId: tenants[1]._id, unitId: units[2]._id, propertyId: props[1]._id, startDate: now, endDate: nextYear, rentAmount: 45000, paymentSchedule: 'Monthly' },
    ]);

    // Payments
    const payments = await Payment.create([
      { leaseId: leases[0]._id, tenantId: tenants[0]._id, propertyId: props[0]._id, amount: 30000, date: now, dueDate: now, method: 'Bank Transfer', status: 'Paid', type: 'Rent' },
      { leaseId: leases[1]._id, tenantId: tenants[1]._id, propertyId: props[1]._id, amount: 45000, date: now, dueDate: now, method: 'Cash', status: 'Paid', type: 'Rent' },
    ]);

    // Expenses
    const expenses = await Expense.create([
      { propertyId: props[0]._id, category: 'Maintenance', amount: 5000, date: now, description: 'Plumbing repairs' },
      { propertyId: props[1]._id, category: 'Utilities', amount: 3000, date: now, description: 'Electricity bill' },
    ]);

    // Utilities
    const utilities = await Utility.create([
      { propertyId: props[0]._id, type: 'Electricity', amount: 3200, dueDate: now, status: 'Paid' },
      { propertyId: props[1]._id, type: 'Water', amount: 800, dueDate: now, status: 'Unpaid' },
    ]);

    console.log('Seed data created:', {
      users: [admin.email, manager.email, tenantUser.email],
      properties: props.length,
      units: units.length,
      tenants: tenants.length,
      leases: leases.length,
      payments: payments.length,
      expenses: expenses.length,
      utilities: utilities.length,
    });

    await mongoose.disconnect();
    console.log('Disconnected. Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
