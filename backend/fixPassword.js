import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

async function fixPassword() {
  try {
    await mongoose.connect('mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent');
    console.log('Connected to MongoDB');

    // Find the admin user
    const user = await User.findOne({ email: 'admin@yenerent.com' });
    if (!user) {
      console.log('Admin user not found');
      return;
    }

    console.log('Current password hash:', user.password);

    // Generate a new proper hash
    const rounds = 10;
    const salt = await bcrypt.genSalt(rounds);
    const newHash = await bcrypt.hash('admin123', salt);

    console.log('New password hash:', newHash);

    // Update the user with the new hash
    user.password = newHash;
    await user.save();

    console.log('Password updated successfully');

    // Test the new password
    const testResult = await user.comparePassword('admin123');
    console.log('Password test result:', testResult);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPassword();
