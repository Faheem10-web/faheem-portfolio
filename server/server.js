import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import apiRouter from './routes/api.js';
import { autoSeedDB } from './scripts/seeder.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Connection
connectDB().then(async () => {
  await autoSeedDB();
});

import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Global Security & Performance Middleware
app.set('etag', false);

// Helmet security headers (configured for Cloudinary images & cross-origin static loading)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  })
);

// Compression middleware
app.use(compression());

// Global Rate Limiter (300 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP address. Please try again later.' }
});
app.use('/api', globalLimiter);

// Strict Login Rate Limiter (15 attempts per 15 minutes per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});
app.use('/api/auth/login', loginLimiter);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Anti-Caching Middleware for all API endpoints
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Serve Uploads Folder Statically (accessible from frontend)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', apiRouter);

// Health Endpoint
app.get('/', (req, res) => {
  res.send('Portfolio API Server is running...');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server successfully started on http://127.0.0.1:${PORT}`);
  });
}

export default app;
