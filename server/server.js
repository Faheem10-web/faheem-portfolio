import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import apiRouter from './routes/api.js';
import { autoSeedDB } from './scripts/seeder.js';

console.log('✓ Environment Loaded');

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';
import { Settings } from './models/schemas.js';

// Auto-sync initial HTML Open Graph meta tags with single Settings document from DB on startup
const syncShareBannerHtmlOnStartup = async () => {
  try {
    const settings = await Settings.findOne().lean();
    if (settings?.shareBanner?.imageUrl) {
      const { imageUrl, updatedAt } = settings.shareBanner;
      const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
      const versionedUrl = imageUrl.includes('?') ? `${imageUrl}&v=${timestamp}` : `${imageUrl}?v=${timestamp}`;
      const htmlPaths = [
        path.join(__dirname, '../index.html'),
        path.join(__dirname, '../dist/index.html')
      ];
      for (const htmlPath of htmlPaths) {
        if (fs.existsSync(htmlPath)) {
          let content = fs.readFileSync(htmlPath, 'utf-8');
          content = content.replace(/<meta property="og:image" content="[^"]*"/i, `<meta property="og:image" content="${versionedUrl}"`);
          content = content.replace(/<meta property="og:image:secure_url" content="[^"]*"/i, `<meta property="og:image:secure_url" content="${versionedUrl}"`);
          content = content.replace(/<meta name="twitter:image" content="[^"]*"/i, `<meta name="twitter:image" content="${versionedUrl}"`);
          fs.writeFileSync(htmlPath, content, 'utf-8');
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Startup HTML Share Banner sync warning:', err.message);
  }
};

// Database Connection (local/standalone server mode)
if (!process.env.VERCEL) {
  connectDB().then(async () => {
    await autoSeedDB();
    await syncShareBannerHtmlOnStartup();
  }).catch(err => {
    console.error('⚠️ Startup DB/Seed error (non-fatal):', err.message);
  });
}

import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Enable trust proxy for Vercel / serverless reverse proxy
app.set('trust proxy', 1);

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
  validate: { trustProxy: false },
  message: { error: 'Too many requests from this IP address. Please try again later.' }
});
app.use('/api', globalLimiter);

// Strict Login Rate Limiter (15 attempts per 15 minutes per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  validate: { trustProxy: false },
  message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});
app.use('/api/auth/login', loginLimiter);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Anti-Caching Middleware for all API endpoints
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  next();
});

// Serve Uploads Folder Statically (accessible from frontend)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', apiRouter);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('⚠️ Express Error Handler:', err.message);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
});

// Health Endpoint
app.get('/', (req, res) => {
  res.send('Portfolio API Server is running...');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT);

  server.on('listening', () => {
    console.log(`Server successfully started on http://127.0.0.1:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process.`);
      console.error(`👉 Close any other running server instances or run: npx kill-port ${PORT}`);
    } else {
      console.error(`⚠️ Express Server Listener Error on port ${PORT}:`, err.message);
    }
  });
}

export default app;
