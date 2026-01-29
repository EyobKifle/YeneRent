import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://yenerent_dev:12345@yenerent-dev.nuzl3ey.mongodb.net/YeneRent?retryWrites=true&w=majority&appName=YeneRent-Dev');
    console.log('Connected to MongoDB');

    const user = await User.findOneAndUpdate(
      { email: 'test@example.com' },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log('User updated successfully:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('User not found');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUser();
