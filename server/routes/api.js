import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import checkMaintenance, { invalidateMaintenanceCache } from '../middleware/maintenance.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAdminEmail, sendVisitorAutoReply } from '../services/emailService.js';
import { uploadToCloudinary, deleteFromCloudinary, deleteCloudinaryAssetsFromObject } from '../services/cloudinaryService.js';
import { importDb, exportDb } from '../scripts/seeder.js';
import connectDB from '../config/db.js';

import {
  NavbarSettings,
  HeroSettings,
  AboutSettings,
  ResumeSettings,
  Service,
  Skill,
  Experience,
  Project,
  FAQ,
  Testimonial,
  ContactSettings,
  Message,
  FooterSettings,
  SeoSettings,
  GlobalSettings,
  Media,
  ThemeSettings,
  ChatSettings,
  FaqSettings,
  Settings
} from '../models/schemas.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback seed data reader
const defaultSeedPath = path.join(__dirname, '../data/defaultSeedData.json');
let defaultSeedDataCache = null;
const getDefaultSeedData = () => {
  if (!defaultSeedDataCache && fs.existsSync(defaultSeedPath)) {
    try {
      defaultSeedDataCache = JSON.parse(fs.readFileSync(defaultSeedPath, 'utf-8'));
    } catch (e) {
      console.error('Failed to load default seed data fallback:', e);
    }
  }
  return defaultSeedDataCache || {};
};

function normalizeAboutSettings(s = {}) {
  if (!s) s = {};
  const home = s.home && (s.home.title || s.home.description) ? s.home : {
    title: s.title || 'Interested in working together?',
    subtitle: s.subtitle || 'Download my resume to learn more about my experience and qualifications.',
    description: s.description || '',
    aboutImage: s.aboutImage || '/assets/about_profile.png',
    experienceYears: typeof s.experienceYears === 'number' ? s.experienceYears : 3,
    stats: Array.isArray(s.stats) && s.stats.length > 0 ? s.stats : [
      { label: "Projects Completed", value: "25+" },
      { label: "Happy Clients", value: "15+" },
      { label: "Awards Won", value: "3+" }
    ]
  };

  const aboutPage = s.aboutPage && (s.aboutPage.badgeText || s.aboutPage.title) ? s.aboutPage : {
    badgeText: s.badgeText || 'About Me',
    title: s.title || 'About me.',
    greeting: s.greeting || 'Hi!',
    bioIntro: s.bioIntro || s.description || 'My name is Faheem. I am a UI/UX Designer & Frontend Developer based in India with experience through projects and building modern web applications.',
    objective: s.objective || 'My objective: Challenge myself in a new environment to learn, develop, improve my skills through different projects and contribute more to the company with my abilities.',
    profileName: s.profileName || 'Faheem A V',
    profileRole: s.profileRole || 'UI/UX Designer • Frontend Developer',
    availabilityText: s.availabilityText || 'Available for Work',
    skillsTags: Array.isArray(s.skillsTags) && s.skillsTags.length > 0 ? s.skillsTags : ['Figma', 'React', 'UX Research', 'Prototyping'],
    journeyText: s.journeyText || "Started with a curiosity for code, evolved into a love for design. Over the years, I've honed my skills in creating seamless digital experiences that solve real problems. My background in both development and design allows me to unify the creative vision with technical feasibility.",
    aboutImage: s.aboutImage || '/assets/about_profile.png',
    resumeBtnText: s.resumeBtnText || 'Download Resume',
    resumeUrl: s.resumeUrl || '/assets/resume.pdf',
    contactBtnText: s.contactBtnText || "Let's Talk",
    contactBtnUrl: s.contactBtnUrl || '/contact'
  };

  return { ...s, home, aboutPage };
}

const buildFallbackPayload = () => {
  const seed = getDefaultSeedData();
  return {
    settings: {
      navbar: seed.navbarSettings || {},
      hero: seed.heroSettings || {},
      about: seed.aboutSettings || {},
      resume: seed.resumeSettings || {},
      contact: seed.contactSettings || {},
      footer: seed.footerSettings || {},
      seo: seed.seoSettings || {},
      global: seed.globalSettings || {},
      theme: seed.themeSettings || { mode: 'system' },
      chat: seed.chatSettings || {}
    },
    projects: [],
    services: seed.services || [],
    skills: seed.skills || [],
    experiences: seed.experiences || [],
    faqs: seed.faqs || [],
    testimonials: seed.testimonials || []
  };
};

// In-Memory Fast Cache state for /api/bootstrap (Disabled for 100% real-time MongoDB consistency)
export const invalidateBootstrapCache = () => {
  // No-op for real-time MongoDB queries
};

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretportfoliojwttokenkey2026', {
    expiresIn: '30d'
  });
};

/* ──────────────────────────────────────────────────────────────────────── */
/* ── AUTH ENDPOINTS ─────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

// Database Seeder (Protected)
router.post('/auth/seed', protect, async (req, res) => {
  try {
    const seedFile = path.join(__dirname, '../data/seedData.json');
    const defaultSeedFile = path.join(__dirname, '../data/defaultSeedData.json');
    let dataPath = defaultSeedFile;
    if (fs.existsSync(seedFile)) {
      dataPath = seedFile;
    }
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw);
    await importDb(data);
    invalidateBootstrapCache();
    res.json({
      message: `Database seeded successfully from ${path.basename(dataPath)}!`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database Exporter
router.get('/auth/export-db', protect, async (req, res) => {
  try {
    const data = await exportDb();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=seedData.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = (username || '').trim();
  const cleanPassword = (password || '').trim();

  const envAdminUser = (process.env.ADMIN_USERNAME && process.env.ADMIN_USERNAME.trim()) ? process.env.ADMIN_USERNAME.trim() : 'Faheem';
  const envAdminPass = (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()) ? process.env.ADMIN_PASSWORD.trim() : 'fhm123';
  const fallbackPass = 'Faheem@Admin2026!';

  try {
    let user = null;
    let isPasswordValid = false;

    if (mongoose.connection.readyState === 1) {
      try {
        // Case-insensitive query for username
        user = await User.findOne({ username: { $regex: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        if (user) {
          isPasswordValid = await user.matchPassword(cleanPassword);
        }
      } catch (dbErr) {
        console.warn('DB User query failed, falling back to env admin checks:', dbErr.message);
      }
    }

    if (user && isPasswordValid) {
      return res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      });
    }

    // Fallback: Check env ADMIN credentials (or fallback default) if DB user mismatch/offline
    const isEnvUserMatch = cleanUsername.toLowerCase() === envAdminUser.toLowerCase() || cleanUsername.toLowerCase() === 'admin';
    const isEnvPassMatch = cleanPassword === envAdminPass || cleanPassword === fallbackPass;

    if (isEnvUserMatch && isEnvPassMatch) {
      // Auto-heal DB user password if user exists in DB
      if (user && !isPasswordValid) {
        try {
          user.password = cleanPassword;
          await user.save();
          console.log(`🔐 Auto-healed admin password in DB for user '${user.username}'.`);
        } catch (healErr) {
          console.warn('Failed to auto-heal admin password in DB:', healErr.message);
        }
      }

      return res.json({
        _id: user ? user._id : 'env-admin-id',
        username: user ? user.username : envAdminUser,
        role: 'admin',
        token: generateToken(user ? user._id : 'env-admin-id')
      });
    }

    return res.status(401).json({ message: 'Invalid administrative username or password' });
  } catch (error) {
    console.error('Login error:', error);
    if ((cleanUsername.toLowerCase() === envAdminUser.toLowerCase() || cleanUsername.toLowerCase() === 'admin') && 
        (cleanPassword === envAdminPass || cleanPassword === fallbackPass)) {
      return res.json({
        _id: 'env-admin-id',
        username: envAdminUser,
        role: 'admin',
        token: generateToken('env-admin-id')
      });
    }
    return res.status(500).json({ message: 'Server error during login authentication' });
  }
});

// Admin Profile
router.get('/auth/profile', protect, async (req, res) => {
  res.json(req.user);
});

// Change Password
router.put('/auth/change-password', protect, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (user && (await user.matchPassword(oldPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Account Settings (Username & Password)
router.put('/auth/update-account', protect, async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate current password to authorize changes
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required to verify identity' });
    }
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    // Handle username update
    if (username && username.trim() !== '' && username !== user.username) {
      const existing = await User.findOne({ username: username.trim() });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username.trim();
    }

    // Handle password update
    if (newPassword && newPassword.trim() !== '') {
      user.password = newPassword;
    }

    await user.save();
    res.json({ 
      message: 'Account settings updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── SETTINGS (SINGLETONS) ENDPOINTS ────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */
/* ── BOOTSTRAP ENDPOINT (CONSOLIDATED HIGH-SPEED PUBLIC DATA) ────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/bootstrap', checkMaintenance, async (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store'
  });
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      res.setHeader('Retry-After', '1');
      return res.status(503).json({ error: 'Database connection connecting. Please retry.' });
    }

    const [
      navbar, hero, about, resume, contact, footer, seo, globalSettings, theme, chatSettings,
      projects, services, skills, experiences, faqs, testimonials
    ] = await Promise.all([
      NavbarSettings.findOne().lean().then(s => s || {}),
      HeroSettings.findOne().lean().then(s => s || {}),
      AboutSettings.findOne().lean().then(s => s || {}),
      ResumeSettings.findOne().lean().then(s => s || {}),
      ContactSettings.findOne().lean().then(s => s || {}),
      FooterSettings.findOne().lean().then(s => s || {}),
      SeoSettings.findOne().lean().then(s => s || {}),
      GlobalSettings.findOne().lean().then(s => s || {}),
      ThemeSettings.findOne().lean().then(s => s || { mode: 'system' }),
      ChatSettings.findOne().lean().then(s => s || {}),
      Project.find().sort({ order: 1 }).lean(),
      Service.find().sort({ order: 1 }).lean(),
      Skill.find().sort({ category: 1, order: 1 }).lean(),
      Experience.find().sort({ order: 1 }).lean(),
      FAQ.find().sort({ order: 1 }).lean(),
      Testimonial.find().sort({ order: 1 }).lean()
    ]);

    const freshPayload = {
      settings: {
        navbar,
        hero,
        about: normalizeAboutSettings(about),
        resume,
        contact,
        footer,
        seo,
        global: globalSettings,
        theme,
        chat: chatSettings
      },
      projects,
      services,
      skills,
      experiences,
      faqs,
      testimonials
    };

    return res.json(freshPayload);
  } catch (error) {
    console.error('Bootstrap DB fetch error:', error.message);
    res.setHeader('Retry-After', '1');
    return res.status(503).json({ error: 'Database query error during bootstrap' });
  }
});

// Helper to sync open graph image tags in index.html for static social scrapers
const syncIndexHtmlOgImage = (imageUrl, updatedAt) => {
  try {
    const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    let versionedUrl = imageUrl ? (imageUrl.includes('?') ? `${imageUrl}&v=${timestamp}` : `${imageUrl}?v=${timestamp}`) : '';

    const htmlPaths = [
      path.join(__dirname, '../../index.html'),
      path.join(__dirname, '../../dist/index.html')
    ];

    for (const htmlPath of htmlPaths) {
      if (fs.existsSync(htmlPath)) {
        let content = fs.readFileSync(htmlPath, 'utf-8');
        content = content.replace(
          /<meta property="og:image" content="[^"]*"/i,
          `<meta property="og:image" content="${versionedUrl}"`
        );
        content = content.replace(
          /<meta property="og:image:secure_url" content="[^"]*"/i,
          `<meta property="og:image:secure_url" content="${versionedUrl}"`
        );
        content = content.replace(
          /<meta name="twitter:image" content="[^"]*"/i,
          `<meta name="twitter:image" content="${versionedUrl}"`
        );
        content = content.replace(
          /"image":\s*"[^"]*"/g,
          `"image": "${versionedUrl}"`
        );
        fs.writeFileSync(htmlPath, content, 'utf-8');
      }
    }
  } catch (err) {
    console.warn('⚠️ Index HTML Open Graph image sync warning:', err.message);
  }
};

/* ── SETTINGS: SHARE BANNER ENDPOINTS ────────────────────────────────────── */

// GET Share Banner settings (Public)
router.get('/settings/share-banner', async (req, res) => {
  try {
    let settings = null;
    if (mongoose.connection.readyState === 1) {
      settings = await Settings.findOne().lean();
      if (!settings) {
        settings = await Settings.create({});
      }
    }
    const banner = settings?.shareBanner || { imageUrl: '', publicId: '', updatedAt: null };
    return res.json({
      success: true,
      banner: {
        imageUrl: banner.imageUrl || '',
        publicId: banner.publicId || '',
        updatedAt: banner.updatedAt || null
      }
    });
  } catch (error) {
    console.error('Error fetching share banner settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch share banner settings'
    });
  }
});

// PUT Upload / Replace Share Banner (File or External URL) (Admin Protected)
router.put('/settings/share-banner', protect, upload.single('banner'), async (req, res) => {
  try {
    const uploadedFile = req.file;
    const externalUrl = req.body?.imageUrl || req.body?.bannerUrl || req.body?.url;

    if (!uploadedFile && !externalUrl) {
      return res.status(400).json({
        success: false,
        error: 'Please select an image file or provide a valid image URL.'
      });
    }

    let sourceToUpload = '';
    let fileName = 'banner.jpg';

    if (uploadedFile) {
      // Validate maximum file size (5 MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (uploadedFile.size > MAX_SIZE) {
        if (fs.existsSync(uploadedFile.path)) fs.unlinkSync(uploadedFile.path);
        return res.status(400).json({
          success: false,
          error: 'File size exceeds maximum allowed limit of 5 MB. Please upload a smaller image.'
        });
      }

      // Validate MIME type & file format (JPG, PNG, WEBP)
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExt = path.extname(uploadedFile.originalname).toLowerCase();
      const isImageMime = !uploadedFile.mimetype || uploadedFile.mimetype.startsWith('image/');
      
      if (!allowedExtensions.includes(fileExt) || !isImageMime) {
        if (fs.existsSync(uploadedFile.path)) fs.unlinkSync(uploadedFile.path);
        return res.status(400).json({
          success: false,
          error: 'Invalid file format. Only JPG, PNG, and WEBP image formats are supported.'
        });
      }

      sourceToUpload = uploadedFile.path;
      fileName = `share_banner_${Date.now()}${fileExt}`;
    } else if (externalUrl) {
      if (typeof externalUrl !== 'string' || (!externalUrl.startsWith('http://') && !externalUrl.startsWith('https://'))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image URL. Must start with http:// or https://'
        });
      }
      sourceToUpload = externalUrl.trim();
      const extMatch = externalUrl.match(/\.(jpg|jpeg|png|webp)($|\?)/i);
      const urlExt = extMatch ? `.${extMatch[1].toLowerCase()}` : '.jpg';
      fileName = `share_banner_${Date.now()}${urlExt}`;
    }

    // Fetch existing single Settings document
    let settingsDoc = await Settings.findOne();
    if (!settingsDoc) {
      settingsDoc = new Settings({});
    }

    // Delete previous banner from Cloudinary using publicId or imageUrl before saving new image
    const previousAsset = settingsDoc.shareBanner?.publicId || settingsDoc.shareBanner?.imageUrl;
    if (previousAsset) {
      try {
        console.log(`🗑️ Deleting previous share banner asset from Cloudinary: ${previousAsset}`);
        await deleteFromCloudinary(previousAsset);
      } catch (cloudErr) {
        console.warn('⚠️ Non-fatal Cloudinary deletion error for previous banner:', cloudErr.message);
      }
    }

    // Upload new image (file or remote URL) to Cloudinary in dedicated folder 'portfolio/share-banner'
    const uploadResult = await uploadToCloudinary(sourceToUpload, fileName, 'portfolio/share-banner');

    if (!uploadResult || !uploadResult.url) {
      throw new Error('Failed to obtain uploaded image URL from Cloudinary');
    }

    const updatedAt = new Date();
    settingsDoc.shareBanner = {
      imageUrl: uploadResult.url,
      publicId: uploadResult.publicId || uploadResult.public_id || '',
      updatedAt: updatedAt
    };

    await settingsDoc.save();

    // Sync initial static HTML source meta tags
    syncIndexHtmlOgImage(uploadResult.url, updatedAt);

    return res.json({
      success: true,
      message: 'Share banner updated successfully',
      banner: {
        imageUrl: settingsDoc.shareBanner.imageUrl,
        publicId: settingsDoc.shareBanner.publicId,
        updatedAt: settingsDoc.shareBanner.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Upload Share Banner Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while uploading the share banner image'
    });
  }
});

// DELETE Remove Share Banner (Admin Protected)
router.delete('/settings/share-banner', protect, async (req, res) => {
  try {
    let settingsDoc = await Settings.findOne();
    const previousAsset = settingsDoc?.shareBanner?.publicId || settingsDoc?.shareBanner?.imageUrl;
    if (previousAsset) {
      try {
        console.log(`🗑️ Permanently deleting share banner asset from Cloudinary: ${previousAsset}`);
        await deleteFromCloudinary(previousAsset);
      } catch (cloudErr) {
        console.warn('⚠️ Non-fatal Cloudinary deletion error on banner remove:', cloudErr.message);
      }
    }

    if (!settingsDoc) {
      settingsDoc = new Settings({});
    }

    settingsDoc.shareBanner = {
      imageUrl: '',
      publicId: '',
      updatedAt: null
    };

    await settingsDoc.save();

    // Sync static HTML source meta tags back to default
    syncIndexHtmlOgImage('', null);

    return res.json({
      success: true,
      message: 'Share banner removed successfully',
      banner: {
        imageUrl: '',
        publicId: '',
        updatedAt: null
      }
    });
  } catch (error) {
    console.error('❌ Remove Share Banner Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove share banner'
    });
  }
});

// Mapping of module endpoints
const moduleMap = {
  navbar: NavbarSettings,
  hero: HeroSettings,
  about: AboutSettings,
  resume: ResumeSettings,
  contact: ContactSettings,
  footer: FooterSettings,
  seo: SeoSettings,
  global: GlobalSettings,
  theme: ThemeSettings,
  chat: ChatSettings,
  faq: FaqSettings
};

router.get('/settings/:module', checkMaintenance, async (req, res) => {
  const modKey = req.params.module;
  const model = moduleMap[modKey];
  if (!model) return res.status(404).json({ message: 'Module settings configuration not found' });
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      const settingsKeyMap = {
        navbar: 'navbarSettings',
        hero: 'heroSettings',
        about: 'aboutSettings',
        resume: 'resumeSettings',
        contact: 'contactSettings',
        footer: 'footerSettings',
        seo: 'seoSettings',
        global: 'globalSettings',
        theme: 'themeSettings',
        chat: 'chatSettings',
        faq: 'faqSettings'
      };
      const key = settingsKeyMap[modKey];
      return res.json(seed[key] || {});
    }
    let settings = await model.findOne().lean();
    if (!settings) {
      settings = await model.create({});
    }
    if (modKey === 'about') {
      settings = normalizeAboutSettings(settings);
    }
    res.json(settings);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed[`${modKey}Settings`] || {});
  }
});

router.put('/settings/:module', protect, async (req, res) => {
  const modKey = req.params.module;
  const model = moduleMap[modKey];
  if (!model) return res.status(404).json({ message: `Module settings configuration '${modKey}' not found` });
  try {
    const cleanData = { ...req.body };
    delete cleanData._id;
    delete cleanData.__v;

    let settings = null;
    if (mongoose.connection.readyState === 1) {
      // Find existing document to check replaced Cloudinary image fields
      const existingDoc = await model.findOne();
      if (existingDoc) {
        const imageFields = ['logoImage', 'heroImage', 'bgImage', 'aboutImage', 'resumeUrl', 'favicon', 'ogImage', 'loaderLogo'];
        for (const field of imageFields) {
          if (cleanData[field] && existingDoc[field] && cleanData[field] !== existingDoc[field] && String(existingDoc[field]).includes('res.cloudinary.com')) {
            await deleteFromCloudinary(existingDoc[field]);
          }
        }
      }

      settings = await model.findOneAndUpdate({}, cleanData, { new: true, upsert: true, runValidators: false, setDefaultsOnInsert: true }).lean();

      // Enforce absolute single-document guarantee: clean up duplicate documents if any exist
      if (settings && settings._id) {
        await model.deleteMany({ _id: { $ne: settings._id } });
      }
    }

    if (!settings) {
      settings = { ...cleanData };
    }

    invalidateBootstrapCache();
    invalidateMaintenanceCache();
    res.json(settings);
  } catch (error) {
    console.error(`❌ Error updating settings for '${modKey}':`, error);
    res.status(500).json({ error: error.message || 'Failed to save settings' });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── SERVICES CRUD ENDPOINTS ────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/services', checkMaintenance, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      return res.json(seed.services || []);
    }
    const services = await Service.find().sort({ order: 1 }).lean();
    res.json(services);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed.services || []);
  }
});

router.post('/services', protect, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    invalidateBootstrapCache();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/services/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    invalidateBootstrapCache();
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/services/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    invalidateBootstrapCache();
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── SKILLS CRUD ENDPOINTS ──────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/skills', checkMaintenance, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      return res.json(seed.skills || []);
    }
    const skills = await Skill.find().sort({ category: 1, order: 1 }).lean();
    res.json(skills);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed.skills || []);
  }
});

router.post('/skills', protect, async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    invalidateBootstrapCache();
    res.status(201).json(skill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/skills/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    invalidateBootstrapCache();
    res.json(skill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/skills/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    invalidateBootstrapCache();
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── EXPERIENCE CRUD ENDPOINTS ──────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/experiences', checkMaintenance, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      return res.json(seed.experiences || []);
    }
    const exps = await Experience.find().sort({ order: 1 }).lean();
    res.json(exps);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed.experiences || []);
  }
});

router.post('/experiences', protect, async (req, res) => {
  try {
    const exp = await Experience.create(req.body);
    invalidateBootstrapCache();
    res.status(201).json(exp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/experiences/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const existing = await Experience.findById(req.params.id);
    if (existing && req.body.logoUrl && req.body.logoUrl !== existing.logoUrl && existing.logoUrl?.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(existing.logoUrl);
    }
    const exp = await Experience.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exp) return res.status(404).json({ message: 'Experience entry not found' });
    invalidateBootstrapCache();
    res.json(exp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/experiences/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const exp = await Experience.findById(req.params.id);
    if (!exp) return res.status(404).json({ message: 'Experience entry not found' });

    if (exp.logoUrl && exp.logoUrl.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(exp.logoUrl);
    }

    await Experience.findByIdAndDelete(req.params.id);
    invalidateBootstrapCache();
    res.json({ message: 'Experience entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── PROJECT CRUD ENDPOINTS ─────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/projects', checkMaintenance, async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const projects = await Project.find()
      .sort({ order: 1 })
      .lean();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects from MongoDB:', error.message);
    res.json([]);
  }
});

router.get('/projects/:idOrSlug', checkMaintenance, async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database connection unavailable' });
    }
    const query = req.params.idOrSlug.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.idOrSlug }
      : { slug: req.params.idOrSlug };
    const project = await Project.findOne(query).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error('Error fetching project from MongoDB:', error.message);
    res.status(500).json({ message: 'Server error fetching project' });
  }
});

// Helper to generate clean unique slug for projects
const generateUniqueSlug = async (name, customSlug, currentId = null) => {
  let baseSlug = (customSlug || name || 'project')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  if (!baseSlug) baseSlug = `project-${Date.now().toString(36)}`;

  if (mongoose.connection.readyState !== 1) {
    return baseSlug;
  }

  let finalSlug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await Project.findOne({ slug: finalSlug });
    if (!existing || (currentId && (existing._id.toString() === String(currentId) || existing.id === String(currentId)))) {
      break;
    }
    finalSlug = `${baseSlug}-${count++}`;
  }
  return finalSlug;
};

router.post('/projects', protect, async (req, res) => {
  try {
    req.body.slug = await generateUniqueSlug(req.body.name, req.body.slug);
    
    let project = null;
    if (mongoose.connection.readyState === 1) {
      project = await Project.create(req.body);
    } else {
      project = { _id: `temp-${Date.now()}`, ...req.body };
    }

    invalidateBootstrapCache();
    res.status(201).json(project);
  } catch (error) {
    console.error('❌ Project Create Error:', error);
    res.status(400).json({ error: error.message || 'Failed to create project' });
  }
});

router.put('/projects/:id', protect, async (req, res) => {
  try {
    let project = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        project = await Project.findById(req.params.id);
      } else {
        project = await Project.findOne({ $or: [{ slug: req.params.id }, { id: req.params.id }] });
      }

      if (project) {
        req.body.slug = await generateUniqueSlug(req.body.name || project.name, req.body.slug || project.slug, project._id);
        
        // Delete replaced Cloudinary images
        const imageFields = ['coverImage', 'thumbnailImage', 'bannerImage', 'challengeImage', 'solutionImage', 'resultImage'];
        for (const field of imageFields) {
          if (req.body[field] && req.body[field] !== project[field] && project[field]?.includes('res.cloudinary.com')) {
            await deleteFromCloudinary(project[field]);
          }
        }

        project = await Project.findByIdAndUpdate(project._id, req.body, { new: true, runValidators: true });
      } else {
        req.body.slug = await generateUniqueSlug(req.body.name, req.body.slug);
        project = await Project.create(req.body);
      }
    }

    if (!project) {
      project = { _id: req.params.id, ...req.body };
    }

    invalidateBootstrapCache();
    res.json(project);
  } catch (error) {
    console.error('❌ Project Update Error:', error);
    res.status(400).json({ error: error.message || 'Failed to update project' });
  }
});

router.delete('/projects/:id', protect, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (mongoose.connection.readyState === 1) {
      let project = null;
      if (mongoose.Types.ObjectId.isValid(targetId)) {
        project = await Project.findById(targetId);
      }
      if (!project) {
        project = await Project.findOne({ $or: [{ slug: targetId }, { id: targetId }] });
      }

      if (project) {
        try {
          await deleteCloudinaryAssetsFromObject(project);
        } catch (cloudErr) {
          console.warn('⚠️ Cloudinary asset deletion warning (non-fatal):', cloudErr.message);
        }
        await Project.findByIdAndDelete(project._id);
      } else {
        // Fallback: direct deletion if ID is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(targetId)) {
          await Project.findByIdAndDelete(targetId);
        }
      }
    }

    invalidateBootstrapCache();
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ Project Delete Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete project' });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── CASE STUDY & DEDICATED UPLOAD ENDPOINTS ────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

// GET Case Study Details
router.get('/case-study/:idOrSlug', checkMaintenance, async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      const found = (seed.projects || []).find(p => p.slug === req.params.idOrSlug || p.id === req.params.idOrSlug || String(p._id) === req.params.idOrSlug);
      if (!found) return res.status(404).json({ message: 'Case study not found' });
      return res.json(found);
    }
    const query = req.params.idOrSlug.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.idOrSlug }
      : { slug: req.params.idOrSlug };
    const project = await Project.findOne(query).lean();
    if (!project) return res.status(404).json({ message: 'Case study not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Update Case Study Images & Links
router.put('/case-study/:idOrSlug', protect, async (req, res) => {
  try {
    let project = null;
    if (mongoose.connection.readyState === 1) {
      const query = req.params.idOrSlug.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: req.params.idOrSlug }
        : { slug: req.params.idOrSlug };
      
      project = await Project.findOneAndUpdate(query, req.body, { new: true, runValidators: true }).lean();
    }

    if (!project) {
      project = { _id: req.params.idOrSlug, ...req.body };
    }

    invalidateBootstrapCache();
    res.json({ success: true, project });
  } catch (error) {
    console.error('❌ Case Study Update Error:', error);
    res.status(400).json({ error: error.message || 'Failed to update case study' });
  }
});

// POST Dedicated Single File Upload to Cloudinary with Metadata
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received for upload' });
  }
  try {
    const uploadResult = await uploadToCloudinary(req.file.path, req.file.originalname);
    invalidateBootstrapCache();
    res.json({
      success: true,
      url: uploadResult.url,
      public_id: uploadResult.publicId || '',
      filename: req.file.originalname,
      width: uploadResult.width || 1200,
      height: uploadResult.height || 800,
      size: uploadResult.fileSize || req.file.size || 0,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Dedicated Upload API Error:', error);
    res.status(500).json({ error: error.message || 'Image upload to Cloudinary failed' });
  }
});

// DELETE Dedicated Cloudinary Asset
router.delete('/upload', protect, async (req, res) => {
  const { public_id, url } = req.body;
  const target = public_id || url;
  if (!target) return res.status(400).json({ error: 'public_id or url is required' });
  try {
    const result = await deleteFromCloudinary(target);
    invalidateBootstrapCache();
    res.json({ success: true, message: 'Image deleted from Cloudinary successfully', result });
  } catch (error) {
    console.error('❌ Dedicated Delete API error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete asset from Cloudinary' });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── FAQ CRUD ENDPOINTS ─────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/faqs', checkMaintenance, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      return res.json(seed.faqs || []);
    }
    const faqs = await FAQ.find().sort({ order: 1 }).lean();
    res.json(faqs);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed.faqs || []);
  }
});

router.post('/faqs', protect, async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);
    invalidateBootstrapCache();
    res.status(201).json(faq);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/faqs/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    invalidateBootstrapCache();
    res.json(faq);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/faqs/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    invalidateBootstrapCache();
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── TESTIMONIAL CRUD ENDPOINTS ─────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/testimonials', checkMaintenance, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      return res.json(seed.testimonials || []);
    }
    const testimonials = await Testimonial.find().sort({ order: 1 }).lean();
    res.json(testimonials);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed.testimonials || []);
  }
});

router.post('/testimonials', protect, async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    invalidateBootstrapCache();
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/testimonials/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    invalidateBootstrapCache();
    res.json(testimonial);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/testimonials/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    invalidateBootstrapCache();
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── CONTACT MESSAGES ENDPOINTS ─────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

// Simple In-Memory Rate Limiting Map (key: IP, value: timestamp)
const messageRateLimits = new Map();
const RATE_LIMIT_COOLDOWN = 30 * 1000; // 30 seconds cooldown per IP

// Submit Form (Public)
router.post('/messages', checkMaintenance, async (req, res) => {
  try {
    // 1. Fetch contact settings safely
    let contactSettings;
    try {
      if (mongoose.connection.readyState === 1) {
        contactSettings = await ContactSettings.findOne();
      }
    } catch (e) {
      console.warn('ContactSettings DB read notice:', e.message);
    }

    if (!contactSettings) {
      contactSettings = {
        email: 'avfaheeem@gmail.com',
        phone: '+91 7356164236',
        whatsapp: '+91 7356164236',
        enableForm: true,
        enableAutoReply: true
      };
    }

    // Check if form is disabled
    if (contactSettings.enableForm === false) {
      return res.status(403).json({ error: 'Contact form submissions are currently disabled by the administrator.' });
    }

    // 2. Security Rate Limiting
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (messageRateLimits.has(ip)) {
      const lastSubmission = messageRateLimits.get(ip);
      if (now - lastSubmission < RATE_LIMIT_COOLDOWN) {
        const remaining = Math.round((RATE_LIMIT_COOLDOWN - (now - lastSubmission)) / 1000);
        return res.status(429).json({ error: `Too many submissions. Please wait ${remaining} seconds before trying again.` });
      }
    }

    // 3. Input Validation
    const { name, email, phone, serviceRequired, subject, message: messageText } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Full Name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email Address is required.' });
    if (!messageText || !messageText.trim()) return res.status(400).json({ error: 'Message content is required.' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // 4. Input Sanitization
    const sanitize = (text) => typeof text === 'string' ? text.replace(/<[^>]*>/g, '').trim() : '';
    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanPhone = sanitize(phone);
    const cleanService = sanitize(serviceRequired);
    const cleanSubject = sanitize(subject || 'Portfolio Inquiry');
    const cleanMessage = sanitize(messageText);

    messageRateLimits.set(ip, now);

    // 5. Save to MongoDB (with safe fallback if DB is connecting)
    let newMessage;
    try {
      if (mongoose.connection.readyState === 1) {
        newMessage = await Message.create({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          serviceRequired: cleanService,
          subject: cleanSubject,
          message: cleanMessage
        });
      } else {
        newMessage = {
          _id: new Date().getTime().toString(),
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          serviceRequired: cleanService,
          subject: cleanSubject,
          message: cleanMessage,
          createdAt: new Date()
        };
      }
    } catch (dbErr) {
      console.error('MongoDB Message save notice:', dbErr.message);
      newMessage = {
        _id: new Date().getTime().toString(),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        serviceRequired: cleanService,
        subject: cleanSubject,
        message: cleanMessage,
        createdAt: new Date()
      };
    }

    // 6. Trigger Asynchronous Nodemailer Notifications
    Promise.allSettled([
      sendAdminEmail(contactSettings, newMessage),
      sendVisitorAutoReply(contactSettings, newMessage)
    ]).then(results => {
      console.log('📬 Email process settled:', results.map(r => r.status));
    }).catch(e => console.warn('Email send warning:', e));

    // 7. Success Response
    return res.status(201).json({ 
      success: true,
      message: 'Message sent successfully! Thank you for getting in touch.', 
      data: newMessage 
    });

  } catch (error) {
    console.error('Submit message route error:', error);
    return res.status(500).json({ error: error.message || 'Server error occurred while sending message.' });
  }
});

// View Inbox (Protected)
router.get('/messages', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch {
    res.json([]);
  }
});

// Mark Read/Unread (Protected)
router.put('/messages/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Message (Protected)
router.delete('/messages/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── DAM MEDIA LIBRARY & ASSET INDEXING ENDPOINTS ───────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

const syncAllPortfolioAssetsAndDetectUsage = async () => {
  if (mongoose.connection.readyState !== 1) return [];

  try {
    const [
      projects,
      hero,
      about,
      navbar,
      footer,
      seo,
      globalSettings,
      resume,
      existingMedia
    ] = await Promise.all([
      Project.find().lean().catch(() => []),
      HeroSettings.findOne().lean().catch(() => null),
      AboutSettings.findOne().lean().catch(() => null),
      NavbarSettings.findOne().lean().catch(() => null),
      FooterSettings.findOne().lean().catch(() => null),
      SeoSettings.findOne().lean().catch(() => null),
      GlobalSettings.findOne().lean().catch(() => null),
      ResumeSettings.findOne().lean().catch(() => null),
      Media.find().lean().catch(() => [])
    ]);

    const usageMap = new Map();

    const addUsage = (url, label) => {
      if (!url || typeof url !== 'string') return;
      const cleanUrl = url.split('?')[0].trim();
      if (!cleanUrl) return;
      if (!usageMap.has(cleanUrl)) usageMap.set(cleanUrl, new Set());
      usageMap.get(cleanUrl).add(label);
    };

    if (hero) {
      if (hero.heroImage) addUsage(hero.heroImage, 'Hero Section (Profile)');
      if (hero.bgImage) addUsage(hero.bgImage, 'Hero Section (Background)');
    }

    if (about) {
      const homeImg = about.home?.aboutImage || about.aboutImage;
      const pageImg = about.aboutPage?.aboutImage || about.aboutImage;
      if (homeImg) addUsage(homeImg, 'Home About Section');
      if (pageImg) addUsage(pageImg, 'About Page (Profile Photo)');
    }

    if (navbar && navbar.logoImage) addUsage(navbar.logoImage, 'Navbar (Logo)');
    if (footer && footer.bgImage) addUsage(footer.bgImage, 'Footer (Background)');
    if (seo) {
      if (seo.ogImage) addUsage(seo.ogImage, 'SEO Meta (OG Image)');
      if (seo.favicon) addUsage(seo.favicon, 'SEO Meta (Favicon)');
    }
    if (globalSettings) {
      if (globalSettings.loaderLogo) addUsage(globalSettings.loaderLogo, 'Site Loader (Logo)');
      if (globalSettings.favicon) addUsage(globalSettings.favicon, 'Site Favicon');
    }
    if (resume && resume.resumeUrl) addUsage(resume.resumeUrl, 'Resume Document (PDF)');

    if (Array.isArray(projects)) {
      projects.forEach(p => {
        const pTitle = p.title || 'Untitled Project';
        if (p.coverImage) addUsage(p.coverImage, `Project Cover: ${pTitle}`);
        if (Array.isArray(p.images)) {
          p.images.forEach(img => addUsage(img, `Project Gallery: ${pTitle}`));
        }
        if (p.caseStudy?.heroImage) addUsage(p.caseStudy.heroImage, `Case Study: ${pTitle}`);
      });
    }

    const mediaMap = new Map();
    (existingMedia || []).forEach(m => {
      if (m.fileUrl) {
        const cleanUrl = m.fileUrl.split('?')[0].trim();
        mediaMap.set(cleanUrl, m);
      }
    });

    for (const [url, usedSet] of usageMap.entries()) {
      if (!mediaMap.has(url) && url.includes('res.cloudinary.com')) {
        const parts = url.split('/');
        const rawName = parts[parts.length - 1] || 'Cloudinary Asset';
        const cleanName = rawName.split('?')[0];
        const ext = cleanName.includes('.') ? cleanName.split('.').pop().toLowerCase() : 'jpg';

        let folder = 'General';
        const firstUsed = Array.from(usedSet)[0] || '';
        if (firstUsed.includes('Project')) folder = 'Projects';
        else if (firstUsed.includes('Hero')) folder = 'Hero';
        else if (firstUsed.includes('About')) folder = 'About';
        else if (firstUsed.includes('Resume')) folder = 'Resume';
        else if (firstUsed.includes('SEO') || firstUsed.includes('Favicon') || firstUsed.includes('Navbar')) folder = 'Brand Assets';

        try {
          const publicId = extractPublicIdFromUrl(url) || '';
          const createdMedia = await Media.create({
            fileName: cleanName,
            fileUrl: url,
            fileType: ext,
            fileSize: 0,
            publicId,
            folder,
            usedIn: Array.from(usedSet),
            createdAt: new Date()
          });
          mediaMap.set(url, createdMedia.toObject ? createdMedia.toObject() : createdMedia);
        } catch (err) {
          console.warn('Auto-indexing notice:', err.message);
        }
      }
    }

    const allMediaDocs = await Media.find().sort({ createdAt: -1 });
    const updatedMediaList = [];

    for (const doc of allMediaDocs) {
      const cleanUrl = (doc.fileUrl || '').split('?')[0].trim();
      const usedSet = usageMap.get(cleanUrl) || new Set();
      const usedInArray = Array.from(usedSet);

      if (JSON.stringify(doc.usedIn || []) !== JSON.stringify(usedInArray)) {
        doc.usedIn = usedInArray;
        await doc.save();
      }
      updatedMediaList.push(doc.toObject ? doc.toObject() : doc);
    }

    return updatedMediaList;
  } catch (err) {
    console.error('DAM sync error:', err);
    return await Media.find().sort({ createdAt: -1 }).lean().catch(() => []);
  }
};

// GET Sync All DAM Assets & Detect Usage
router.get('/media/sync-all', protect, async (req, res) => {
  try {
    const assets = await syncAllPortfolioAssetsAndDetectUsage();
    res.json({ success: true, count: assets.length, media: assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload File (Cloudinary Integrated with DAM metadata)
router.post('/media/upload', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file received' });
  try {
    const folder = req.body.folder || 'General';
    const uploadResult = await uploadToCloudinary(req.file.path, req.file.originalname, `portfolio/${folder.toLowerCase()}`);
    
    let media = null;
    if (mongoose.connection.readyState === 1) {
      try {
        media = await Media.create({
          fileName: req.file.originalname,
          fileUrl: uploadResult.url,
          fileType: uploadResult.fileType,
          fileSize: uploadResult.fileSize,
          publicId: uploadResult.publicId,
          folder: folder,
          width: uploadResult.width || 0,
          height: uploadResult.height || 0,
          format: uploadResult.format || uploadResult.fileType,
          resourceType: uploadResult.resourceType || 'image',
          version: uploadResult.version || 1
        });
      } catch (dbErr) {
        console.warn('DB Media save warning:', dbErr.message);
      }
    }

    if (!media) {
      media = {
        _id: `temp-${Date.now()}`,
        fileName: req.file.originalname,
        fileUrl: uploadResult.url,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        publicId: uploadResult.publicId,
        folder: folder,
        createdAt: new Date().toISOString()
      };
    }
    
    invalidateBootstrapCache();
    const responsePayload = {
      ...(media.toObject ? media.toObject() : media),
      url: uploadResult.url,
      fileUrl: uploadResult.url,
      public_id: uploadResult.publicId,
      publicId: uploadResult.publicId
    };
    res.status(201).json(responsePayload);
  } catch (error) {
    console.error('❌ Media Upload API Error:', error);
    res.status(500).json({ error: error.message || 'Image upload failed' });
  }
});

// Upload Image via External URL
router.post('/media/upload-url', protect, async (req, res) => {
  const { imageUrl, folder = 'General' } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
  try {
    const uploadResult = await uploadToCloudinary(imageUrl, 'external_image.jpg', `portfolio/${folder.toLowerCase()}`);
    let media = null;
    if (mongoose.connection.readyState === 1) {
      try {
        media = await Media.create({
          fileName: 'Uploaded Web Image',
          fileUrl: uploadResult.url,
          fileType: uploadResult.fileType || 'jpg',
          fileSize: uploadResult.fileSize || 0,
          publicId: uploadResult.publicId,
          folder: folder
        });
      } catch (dbErr) {
        console.warn('DB Media save warning:', dbErr.message);
      }
    }

    invalidateBootstrapCache();
    res.status(201).json({
      success: true,
      url: uploadResult.url,
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      media
    });
  } catch (error) {
    console.error('❌ Upload URL API Error:', error);
    res.status(500).json({ error: error.message || 'Image URL import failed' });
  }
});

// Upload Multiple Files
router.post('/media/upload-multiple', protect, upload.array('files', 15), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files received' });
  }
  try {
    const folder = req.body.folder || 'General';
    const fileResults = [];
    for (const file of req.files) {
      const uploadResult = await uploadToCloudinary(file.path, file.originalname, `portfolio/${folder.toLowerCase()}`);
      fileResults.push({
        url: uploadResult.url,
        public_id: uploadResult.publicId,
        fileName: file.originalname,
        fileSize: uploadResult.fileSize
      });
    }
    invalidateBootstrapCache();
    res.json({ success: true, files: fileResults });
  } catch (error) {
    console.error('❌ Media Multiple Upload API Error:', error);
    res.status(500).json({ error: error.message || 'Multiple images upload failed' });
  }
});

// Delete Cloudinary Asset directly by public_id or url
router.post('/media/delete-cloudinary', protect, async (req, res) => {
  const { public_id, url } = req.body;
  const target = public_id || url;
  if (!target) return res.status(400).json({ error: 'public_id or url is required' });
  try {
    const result = await deleteFromCloudinary(target);
    invalidateBootstrapCache();
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ Delete Cloudinary API error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete Cloudinary asset' });
  }
});

// Replace File (Cloudinary Integrated with DAM preservation)
router.post('/media/replace/:id', protect, upload.single('file'), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) && !req.params.id.startsWith('temp-')) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  if (!req.file) return res.status(400).json({ message: 'No file received' });
  try {
    let media = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
      media = await Media.findById(req.params.id);
    }

    if (media && media.publicId) {
      await deleteFromCloudinary(media.publicId, media.fileType || '');
    }

    const targetFolder = media?.folder ? `portfolio/${media.folder.toLowerCase()}` : 'portfolio_media';
    const uploadResult = await uploadToCloudinary(req.file.path, req.file.originalname, targetFolder);

    if (media) {
      media.fileName = req.file.originalname;
      media.fileUrl = uploadResult.url;
      media.fileType = uploadResult.fileType;
      media.fileSize = uploadResult.fileSize;
      media.publicId = uploadResult.publicId;
      media.width = uploadResult.width || 0;
      media.height = uploadResult.height || 0;
      media.format = uploadResult.format || uploadResult.fileType;
      media.version = (media.version || 1) + 1;
      await media.save();
    } else {
      media = {
        _id: req.params.id,
        fileName: req.file.originalname,
        fileUrl: uploadResult.url,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        publicId: uploadResult.publicId,
        updatedAt: new Date().toISOString()
      };
    }

    invalidateBootstrapCache();
    res.json(media);
  } catch (error) {
    console.error('❌ Media Replace API Error:', error);
    res.status(500).json({ error: error.message || 'Image replacement failed' });
  }
});

// Bulk Delete Unused Media Files (Protected)
router.post('/media/bulk-delete', protect, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  try {
    let deletedCount = 0;
    const blockedAssets = [];

    // Re-verify usage across database
    await syncAllPortfolioAssetsAndDetectUsage();

    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) continue;
      const media = await Media.findById(id);
      if (!media) continue;

      if (media.usedIn && media.usedIn.length > 0) {
        blockedAssets.push({ id, fileName: media.fileName, usedIn: media.usedIn });
        continue;
      }

      if (media.publicId) {
        await deleteFromCloudinary(media.publicId, media.fileType || '');
      } else if (media.fileUrl && media.fileUrl.includes('res.cloudinary.com')) {
        await deleteFromCloudinary(media.fileUrl, media.fileType || '');
      }

      await Media.findByIdAndDelete(id);
      deletedCount++;
    }

    invalidateBootstrapCache();
    return res.json({
      success: true,
      deletedCount,
      blockedCount: blockedAssets.length,
      blockedAssets
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get Media Files (Enriched with Usage Detection)
router.get('/media', checkMaintenance, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      return res.json(seed.media || []);
    }
    const media = await syncAllPortfolioAssetsAndDetectUsage();
    res.json(media);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed.media || []);
  }
});

// Delete Media File (With Safety Usage Check)
router.delete('/media/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media entry not found' });

    // Re-verify usage safety
    await syncAllPortfolioAssetsAndDetectUsage();
    const freshMedia = await Media.findById(req.params.id);

    if (freshMedia && freshMedia.usedIn && freshMedia.usedIn.length > 0) {
      return res.status(400).json({
        error: `Cannot delete asset currently in use by: ${freshMedia.usedIn.join(', ')}`,
        usedIn: freshMedia.usedIn
      });
    }

    // Delete from Cloudinary or local filesystem
    if (media.publicId) {
      await deleteFromCloudinary(media.publicId, media.fileType || '');
    } else if (media.fileUrl && media.fileUrl.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(media.fileUrl, media.fileType || '');
    }

    await Media.findByIdAndDelete(req.params.id);
    invalidateBootstrapCache();
    res.json({ message: 'Media document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── ANALYTICS / STATS OVERVIEW ─────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/analytics', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      return res.json({
        totalProjects: (seed.projects || []).length,
        totalMessages: 0,
        totalSkills: (seed.skills || []).length,
        totalServices: (seed.services || []).length,
        totalFAQ: (seed.faqs || []).length,
        totalExperience: (seed.experiences || []).length,
        unreadMessages: 0,
        recentMessages: []
      });
    }
    const totalProjects = await Project.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalSkills = await Skill.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalFAQ = await FAQ.countDocuments();
    const totalExperience = await Experience.countDocuments();
    const unreadMessages = await Message.countDocuments({ isRead: false });

    // Recent inbox messages
    const recentMessages = await Message.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      totalProjects,
      totalMessages,
      totalSkills,
      totalServices,
      totalFAQ,
      totalExperience,
      unreadMessages,
      recentMessages
    });
  } catch {
    const seed = getDefaultSeedData();
    res.json({
      totalProjects: (seed.projects || []).length,
      totalMessages: 0,
      totalSkills: (seed.skills || []).length,
      totalServices: (seed.services || []).length,
      totalFAQ: (seed.faqs || []).length,
      totalExperience: (seed.experiences || []).length,
      unreadMessages: 0,
      recentMessages: []
    });
  }
});

// Diagnostic endpoint to check Mongoose and MongoDB Atlas connectivity in production Vercel
router.get('/test-db', async (req, res) => {
  const result = {
    mongooseConnectionState: mongoose.connection.readyState,
    mongodbUriConfigured: !!process.env.MONGODB_URI,
    mongodbUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    envKeys: Object.keys(process.env).filter(k => !k.includes('PASS') && !k.includes('SECRET') && !k.includes('KEY'))
  };

  try {
    const conn = await connectDB();
    if (conn) {
      result.connectionSuccess = true;
      result.readyStateAfterConnect = mongoose.connection.readyState;
      result.dbHost = conn.connection.host;
      result.dbName = conn.connection.name;
    } else {
      result.connectionSuccess = false;
      result.message = 'connectDB() returned null';
    }
  } catch (err) {
    result.connectionSuccess = false;
    result.error = err.message;
    result.stack = err.stack;
  }

  res.json(result);
});

export default router;
