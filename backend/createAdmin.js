import mongoose from 'mongoose';
import User from './models/User.js';

async function createAdmin() {
  try {
    await mongoose.connect('mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@yenerent.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', {
        id: existingAdmin._id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
      await mongoose.disconnect();
      return;
    }

    // Create new admin user
    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@yenerent.com',
      password: 'admin123',
      role: 'admin'
    });

    await adminUser.save();

    console.log('Admin user created successfully:', {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
