import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function runBenchmark() {
  console.log('====================================================');
  console.log('  PORTFOLIO RUNTIME PRODUCTION PERFORMANCE AUDIT   ');
  console.log('====================================================');

  // 1. Measure MongoDB Connection Time & Database Query Execution Time
  console.log('\n[1] MONGODB & DATABASE QUERY TIMINGS');
  const mongoStart = Date.now();
  let connTime = 0;
  let queryTime = 0;

  try {
    const connStart = Date.now();
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faheem_portfolio', {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    connTime = Date.now() - connStart;
    console.log(`- MongoDB Connection Time: ${connTime} ms (CONNECTED)`);

    const qStart = Date.now();
    const collections = ['navbarssettings', 'herosettings', 'aboutsettings', 'resumesettings', 'projects', 'services', 'skills', 'experiences', 'faqs', 'testimonials'];
    const db = mongoose.connection.db;
    
    for (const col of collections) {
      await db.collection(col).find({}).limit(100).toArray();
    }
    queryTime = Date.now() - qStart;
    console.log(`- Database Query Execution Time (10 parallel collections): ${queryTime} ms`);
    await mongoose.disconnect();
  } catch (err) {
    connTime = Date.now() - mongoStart;
    console.log(`- MongoDB Connection Time: ${connTime} ms (OFFLINE/TIMEOUT: ${err.message})`);
    console.log(`- Database Query Execution Time: 0 ms (Served via Fallback Seed Data)`);
  }

  // 2. Measure /api/bootstrap Endpoint Duration & TTFB
  console.log('\n[2] SERVER & API ENDPOINT TIMINGS');
  const apiStart = Date.now();
  try {
    const res = await fetch('http://localhost:5000/api/bootstrap');
    const apiDuration = Date.now() - apiStart;
    const data = await res.json();
    console.log(`- /api/bootstrap response time: ${apiDuration} ms`);
    console.log(`- /api/bootstrap HTTP status: ${res.status}`);
    console.log(`- Payload size: ${(JSON.stringify(data).length / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.log(`- /api/bootstrap error: ${err.message}`);
  }

  // 3. Measure Frontend HTML TTFB (http://localhost:5173 or preview)
  console.log('\n[3] FRONTEND DOCUMENT TTFB');
  const htmlStart = Date.now();
  try {
    const res = await fetch('http://localhost:5173/');
    const htmlDuration = Date.now() - htmlStart;
    const text = await res.text();
    console.log(`- Time To First Byte (TTFB) for index.html: ${htmlDuration} ms`);
    console.log(`- Document size: ${(text.length / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.log(`- Frontend document fetch error: ${err.message}`);
  }

  // 4. Measure Cloudinary / External Image Response Times
  console.log('\n[4] CLOUDINARY / EXTERNAL IMAGE RESPONSE TIMES');
  const sampleImages = [
    'https://res.cloudinary.com/ddluoarzr/image/upload/v1/samples/landscapes/nature-hero.jpg',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60'
  ];
  for (const imgUrl of sampleImages) {
    const imgStart = Date.now();
    try {
      const res = await fetch(imgUrl, { method: 'HEAD' });
      const imgDuration = Date.now() - imgStart;
      console.log(`- Image response time (${imgUrl.substring(0, 50)}...): ${imgDuration} ms (Status: ${res.status})`);
    } catch (err) {
      console.log(`- Image fetch error: ${err.message}`);
    }
  }

  // 5. Frontend Bundle & Asset Analysis
  console.log('\n[5] FRONTEND BUNDLE & ASSET ANALYSIS (dist/)');
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const files = fs.readdirSync(assetsPath);
      let totalJs = 0;
      let totalCss = 0;
      files.forEach(file => {
        const stat = fs.statSync(path.join(assetsPath, file));
        if (file.endsWith('.js')) {
          totalJs += stat.size;
          console.log(`  └─ JS Bundle: ${file} (${(stat.size / 1024).toFixed(2)} KB)`);
        } else if (file.endsWith('.css')) {
          totalCss += stat.size;
          console.log(`  └─ CSS Bundle: ${file} (${(stat.size / 1024).toFixed(2)} KB)`);
        }
      });
      console.log(`- Total JavaScript Execution Payload: ${(totalJs / 1024).toFixed(2)} KB`);
      console.log(`- Total Render-Blocking CSS Payload: ${(totalCss / 1024).toFixed(2)} KB`);
    }
  }

  console.log('====================================================\n');
}

runBenchmark();
