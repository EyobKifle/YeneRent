import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Unit from './models/Unit.js';
import Property from './models/Property.js';

dotenv.config();

async function checkUnits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    const units = await Unit.find({});
    console.log(`Found ${units.length} units:`);
    
    for (const unit of units) {
      console.log(`\n- Unit: ${unit.unitNumber}`);
      console.log(`  ID: ${unit._id}`);
      console.log(`  PropertyId: ${unit.propertyId}`);
      console.log(`  OwnerId: ${unit.ownerId || 'NOT SET'}`);
      
      if (unit.propertyId) {
        const property = await Property.findById(unit.propertyId);
        if (property) {
          console.log(`  ✓ Property found: ${property.name} (ownerId: ${property.ownerId})`);
        } else {
          console.log(`  ✗ Property NOT FOUND - orphaned unit!`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUnits();
