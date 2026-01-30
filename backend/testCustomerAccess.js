/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';
import User from './models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testCustomerAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    // Find a customer user
    const user = await User.findOne({ role: 'customer' });
    if (!user) {
      console.log('No customer user found');
      return;
    }

    console.log(`Testing with customer user: ${user.name} (${user.email})`);

    // Generate token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    console.log(`Generated token: ${token.substring(0, 50)}...`);

    // Test properties endpoint
    console.log('\n--- Testing Properties ---');
    const propertiesResponse = await fetch('http://localhost:5000/api/properties', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Properties status: ${propertiesResponse.status}`);
    if (propertiesResponse.ok) {
      const data = await propertiesResponse.json();
      console.log(`Properties returned: ${data.properties?.length || 0} items`);
    } else {
      const error = await propertiesResponse.text();
      console.log('Properties error:', error);
    }

    // Test tenants endpoint
    console.log('\n--- Testing Tenants ---');
    const tenantsResponse = await fetch('http://localhost:5000/api/tenants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Tenants status: ${tenantsResponse.status}`);
    if (tenantsResponse.ok) {
      const data = await tenantsResponse.json();
      console.log(`Tenants returned: ${data.length || 0} items`);
    } else {
      const error = await tenantsResponse.text();
      console.log('Tenants error:', error);
    }

    // Test payments endpoint
    console.log('\n--- Testing Payments ---');
    const paymentsResponse = await fetch('http://localhost:5000/api/payments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Payments status: ${paymentsResponse.status}`);
    if (paymentsResponse.ok) {
      const data = await paymentsResponse.json();
      console.log(`Payments returned: ${data.length || 0} items`);
    } else {
      const error = await paymentsResponse.text();
      console.log('Payments error:', error);
    }

    // Test maintenance endpoint
    console.log('\n--- Testing Maintenance ---');
    const maintenanceResponse = await fetch('http://localhost:5000/api/maintenance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Maintenance status: ${maintenanceResponse.status}`);
    if (maintenanceResponse.ok) {
      const data = await maintenanceResponse.json();
      console.log(`Maintenance returned: ${data.length || 0} items`);
    } else {
      const error = await maintenanceResponse.text();
      console.log('Maintenance error:', error);
    }

    // Test utilities endpoint
    console.log('\n--- Testing Utilities ---');
    const utilitiesResponse = await fetch('http://localhost:5000/api/utilities', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Utilities status: ${utilitiesResponse.status}`);
    if (utilitiesResponse.ok) {
      const data = await utilitiesResponse.json();
      console.log(`Utilities returned: ${data.length || 0} items`);
    } else {
      const error = await utilitiesResponse.text();
      console.log('Utilities error:', error);
    }

    // Test analytics endpoint
    console.log('\n--- Testing Analytics ---');
    const analyticsResponse = await fetch('http://localhost:5000/api/analytics/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Analytics status: ${analyticsResponse.status}`);
    if (analyticsResponse.ok) {
      const data = await analyticsResponse.json();
      console.log('Analytics returned successfully');
    } else {
      const error = await analyticsResponse.text();
      console.log('Analytics error:', error);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testCustomerAccess();
