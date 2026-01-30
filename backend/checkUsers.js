import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const checkUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev', {
      autoIndex: true,
    });

    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('-password'); // Exclude password field

    console.log(`\nTotal users found: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('Users in database:');
      console.log('==================');

      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Email Verified: ${user.isEmailVerified}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Last Login: ${user.lastLogin || 'Never'}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
checkUsers();
