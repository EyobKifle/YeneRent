import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from './models/Property.js';
import User from './models/User.js';

dotenv.config();

async function checkPropertiesDetailed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    const properties = await Property.find({});
    console.log(`Found ${properties.length} properties:\n`);
    
    for (const property of properties) {
      console.log(`- ${property.name}`);
      console.log(`  ID: ${property._id}`);
      console.log(`  OwnerId: ${property.ownerId || 'NOT SET'}`);
      
      if (property.ownerId) {
        const owner = await User.findById(property.ownerId);
        if (owner) {
          console.log(`  Owner: ${owner.name} (${owner.email})`);
        }
      }
      console.log('');
    }

    // Check users
    console.log('\n=== Users ===');
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    for (const user of users) {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPropertiesDetailed();
