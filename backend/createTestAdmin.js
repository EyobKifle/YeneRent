import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    // Check if test admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@yenerent.test' });
    if (existingAdmin) {
      console.log('Test admin user already exists, updating password...');
      // Set plain text password; the User model's pre-save hook will hash it
      existingAdmin.password = 'Password123!';
      await existingAdmin.save();

      console.log('Test admin password updated successfully');
      console.log('Login credentials:');
      console.log('Email: admin@yenerent.test');
      console.log('Password: Password123!');
    } else {
      // Create new test admin user with plain text password
      // The User model's pre-save hook will handle hashing automatically
      const adminUser = new User({
        name: 'Test Admin',
        email: 'admin@yenerent.test',
        password: 'Password123!',
        role: 'admin',
        isActive: true
      });

      await adminUser.save();

      console.log('Test admin user created successfully');
      console.log('Login credentials:');
      console.log('Email: admin@yenerent.test');
      console.log('Password: Password123!');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestAdmin();
