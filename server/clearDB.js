import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Listing from './models/Listing.js';
import SwapRequest from './models/SwapRequest.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';

dotenv.config();

const clear = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rewear');
    console.log('Connected to MongoDB...');
    
    await User.deleteMany({});
    await Listing.deleteMany({});
    await SwapRequest.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    
    console.log('Database cleared successfully! All old/corrupted test accounts deleted.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear database:', err);
    process.exit(1);
  }
};

clear();
