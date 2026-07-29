import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rewear');
    console.log('Connected to MongoDB...');
    
    const user = await User.create({
      name: 'Test Swapper',
      username: 'test_swapper_' + Math.round(Math.random() * 1000),
      email: 'test' + Math.round(Math.random() * 1000) + '@gmail.com',
      password: 'password123',
      locationName: 'San Francisco, CA',
      locationCoordinates: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      }
    });
    
    console.log('Successfully registered test user:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('Test registration failed:', err);
    process.exit(1);
  }
};

test();
