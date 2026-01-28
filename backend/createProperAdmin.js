import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

async function createProperAdmin() {
  try {
    await mongoose.connect('mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@yenerent.com' });
    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      // Hash the password properly
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      const salt = await bcrypt.genSalt(rounds);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      existingAdmin.password = hashedPassword;
      await existingAdmin.save();

      console.log('Admin password updated successfully');
      console.log('Login credentials:');
      console.log('Email: admin@yenerent.com');
      console.log('Password: admin123');
    } else {
      // Create new admin user with properly hashed password
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      const salt = await bcrypt.genSalt(rounds);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const adminUser = new User({
        name: 'System Admin',
        email: 'admin@yenerent.com',
        password: hashedPassword,
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
