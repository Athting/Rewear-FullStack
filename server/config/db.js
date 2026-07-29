import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn("WARNING: MONGODB_URI is not defined. Server will run with mock state fallbacks.");
      return;
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn("WARNING: MongoDB Connection Failed. Server is running in memory/mock fallback mode.");
  }
};

export default connectDB;
