import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Fix Windows DNS SRV lookup for MongoDB Atlas clusters locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Ignore error if DNS servers cannot be changed
  }
}

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
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const timeoutVal = isProd ? 15000 : 3000;

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faheem_portfolio', {
      maxPoolSize: isProd ? 5 : 10,
      minPoolSize: isProd ? 0 : 2,
      serverSelectionTimeoutMS: timeoutVal,
      connectTimeoutMS: timeoutVal,
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
