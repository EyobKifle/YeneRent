import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/Property.js';
import User from '../models/User.js';

dotenv.config();

async function assignPropertiesToOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    // Find a customer user to assign properties to
    const customer = await User.findOne({ role: { $in: ['customer', 'owner'] } });
    
    if (!customer) {
      console.log('No customer or owner user found! Please create one first.');
      await mongoose.disconnect();
      return;
    }

    console.log(`\nAssigning properties to: ${customer.name} (${customer.email})\n`);

    // Find all properties without ownerId
    const properties = await Property.find({ $or: [{ ownerId: { $exists: false } }, { ownerId: null }] });
    console.log(`Found ${properties.length} properties without ownerId\n`);

    for (const property of properties) {
      property.ownerId = customer._id;
      await property.save();
      console.log(`✓ Assigned "${property.name}" to ${customer.name}`);
    }

    console.log(`\n=== Successfully assigned ${properties.length} properties ===`);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignPropertiesToOwners();
