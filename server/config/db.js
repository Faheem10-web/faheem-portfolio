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

// Prevent unhandled Mongoose connection error events from terminating the process
mongoose.connection.on('error', (err) => {
  // Handled gracefully in connectDB catch block
});

// Cached connection variable
let cachedConnection = null;

const connectDB = async () => {
  // If connection is already open and ready, reuse it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Missing MONGODB_URI in .env');
    return null;
  }

  const sanitizedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
  console.log(`✓ MongoDB URI Loaded: ${sanitizedUri}`);
  console.log('✓ Connecting to MongoDB Atlas...');

  try {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const timeoutVal = isProd ? 15000 : 10000;

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: isProd ? 5 : 10,
      minPoolSize: isProd ? 0 : 2,
      serverSelectionTimeoutMS: timeoutVal,
      connectTimeoutMS: timeoutVal,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    cachedConnection = conn;
    console.log('✓ MongoDB Connected Successfully');
    console.log(`  • Database: ${conn.connection.name}`);
    console.log(`  • Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`);
    return null;
  }
};

export default connectDB;
