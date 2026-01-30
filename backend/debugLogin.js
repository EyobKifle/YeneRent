import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    // Find the admin user
    const user = await User.findOne({ email: 'admin@yenerent.com' });
    if (!user) {
      console.log('Admin user not found');
      return;
    }

    console.log('User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordLength: user.password.length,
      passwordHash: user.password.substring(0, 20) + '...'
    });

    // Test password comparison
    const testPassword = 'Password123!';
    console.log('Testing password:', testPassword);

    const isValid = await user.comparePassword(testPassword);
    console.log('Password comparison result:', isValid);

    // Also test bcrypt directly
    const bcryptResult = await bcrypt.compare(testPassword, user.password);
    console.log('Direct bcrypt comparison result:', bcryptResult);

    // Test with wrong password
    const wrongPassword = 'wrong123';
    const wrongResult = await user.comparePassword(wrongPassword);
    console.log('Wrong password test result:', wrongResult);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugLogin();
