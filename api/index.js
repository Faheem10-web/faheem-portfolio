import app from '../server/server.js';
import connectDB from '../server/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.warn('⚠️ Serverless handler DB connection warning:', err.message);
  }
  return app(req, res);
}
