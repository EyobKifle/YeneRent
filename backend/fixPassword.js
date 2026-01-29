import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@yenerent.com';
    const adminPassword = 'admin123'; // The password you want to set

    // Find the admin user
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.log(`Admin user with email ${adminEmail} not found. Please run the createProperAdmin.js script first to create it.`);
      await mongoose.disconnect();
      return;
    }

    console.log('Current password hash:', user.password);

    // Generate a new proper hash
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const salt = await bcrypt.genSalt(rounds);
    const newHash = await bcrypt.hash(adminPassword, salt);

    console.log('New password hash:', newHash);

    // Update the user with the new hash using updateOne to bypass Mongoose save hooks
    await User.updateOne({ email: adminEmail }, { $set: { password: newHash } });

    console.log('Password updated successfully');

    // Test the new password
    const updatedUser = await User.findOne({ email: adminEmail });
    const testResult = await bcrypt.compare(adminPassword, updatedUser.password);
    console.log('Password test result (direct bcrypt):', testResult); // Should be true

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPassword();
