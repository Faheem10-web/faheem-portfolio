import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Disable command buffering globally so queries fail fast rather than hanging for 10s
mongoose.set('bufferCommands', false);

// Cached connection variable
let cachedConnection = null;

const connectDB = async () => {
  // If connection is already open and ready, reuse it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faheem_portfolio', {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 1000,
      connectTimeoutMS: 1000,
      family: 4,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning: ${error.message} (Serving fallback seed data in-memory mode)`);
    return null;
  }
};

export default connectDB;
