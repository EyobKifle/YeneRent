import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fixAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev', { autoIndex: true });
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'admin@yenerent.test' });
    if (user) {
      user.password = 'Password123!';
      await user.save();
      console.log('Password updated for admin@yenerent.test');
    } else {
      console.log('User not found');
    }

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error:', err);
  }
};

fixAdminPassword();
