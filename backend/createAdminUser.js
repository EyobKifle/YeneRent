import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
    });
    console.log('Connected to MongoDB');

    // Define User schema (inline for this script)
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      role: { type: String, enum: ['admin', 'property_manager', 'tenant'], default: 'tenant' },
      password: { type: String, required: true },
      isActive: { type: Boolean, default: true },
      lastLogin: { type: Date, default: null },
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@yenerent.com' });
    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      // Hash the password
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      const salt = await bcrypt.genSalt(rounds);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('Admin password updated successfully');
    } else {
      // Create new admin user
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      const salt = await bcrypt.genSalt(rounds);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const adminUser = new User({
        name: 'System Admin',
        email: 'admin@yenerent.com',
        phone: '',
        role: 'admin',
        password: hashedPassword,
        isActive: true
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminUser();
