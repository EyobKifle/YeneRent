import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function createProperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@yenerent.com' });
    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      // Set plain text password; the User model's pre-save hook will hash it
      existingAdmin.password = 'admin123';
      await existingAdmin.save();

      console.log('Admin password updated successfully');
      console.log('Login credentials:');
      console.log('Email: admin@yenerent.com');
      console.log('Password: admin123');
    } else {
      // Create new admin user with plain text password
      // The User model's pre-save hook will handle hashing automatically
      const adminUser = new User({
        name: 'System Admin',
        email: 'admin@yenerent.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });

      await adminUser.save();

      console.log('Admin user created successfully');
      console.log('Login credentials:');
      console.log('Email: admin@yenerent.com');
      console.log('Password: admin123');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createProperAdmin();
