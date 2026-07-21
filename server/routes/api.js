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
  ThemeSettings
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
      theme: seed.themeSettings || { mode: 'system' }
    },
    projects: seed.projects || [],
    services: seed.services || [],
    skills: seed.skills || [],
    experiences: seed.experiences || [],
    faqs: seed.faqs || [],
    testimonials: seed.testimonials || []
  };
};

// In-Memory Fast Cache state for /api/bootstrap (Pre-warmed with fallback data)
let cachedBootstrapPayload = buildFallbackPayload();
let lastBootstrapFetch = 0;
const CACHE_TTL_MS = 60 * 1000;

export const invalidateBootstrapCache = () => {
  cachedBootstrapPayload = null;
  lastBootstrapFetch = 0;
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
  const envAdminUser = (process.env.ADMIN_USERNAME && process.env.ADMIN_USERNAME.trim()) ? process.env.ADMIN_USERNAME.trim() : 'admin';
  const envAdminPass = (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()) ? process.env.ADMIN_PASSWORD.trim() : 'Faheem@Admin2026!';

  try {
    let user = null;
    let isPasswordValid = false;

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ username });
        if (user) {
          isPasswordValid = await user.matchPassword(password);
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

    // Fallback: Check env ADMIN credentials if user not in DB or DB offline
    if (username === envAdminUser && password === envAdminPass) {
      return res.json({
        _id: 'env-admin-id',
        username: envAdminUser,
        role: 'admin',
        token: generateToken('env-admin-id')
      });
    }

    return res.status(401).json({ message: 'Invalid administrative username or password' });
  } catch (error) {
    console.error('Login error:', error);
    if (username === envAdminUser && password === envAdminPass) {
      return res.json({
        _id: 'env-admin-id',
        username: envAdminUser,
        role: 'admin',
        token: generateToken('env-admin-id')
      });
    }
    res.status(500).json({ message: error.message || 'Server authentication error' });
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
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  try {
    const now = Date.now();
    if (cachedBootstrapPayload && (now - lastBootstrapFetch < CACHE_TTL_MS)) {
      return res.json(cachedBootstrapPayload);
    }

    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      if (!cachedBootstrapPayload) {
        cachedBootstrapPayload = buildFallbackPayload();
      }
      return res.json(cachedBootstrapPayload);
    }

    // Fast query execution with lean and default fallbacks without triggering DB write side-effects
    const queryPromise = Promise.all([
      NavbarSettings.findOne().lean().then(s => s || {}),
      HeroSettings.findOne().lean().then(s => s || {}),
      AboutSettings.findOne().lean().then(s => s || {}),
      ResumeSettings.findOne().lean().then(s => s || {}),
      ContactSettings.findOne().lean().then(s => s || {}),
      FooterSettings.findOne().lean().then(s => s || {}),
      SeoSettings.findOne().lean().then(s => s || {}),
      GlobalSettings.findOne().lean().then(s => s || {}),
      ThemeSettings.findOne().lean().then(s => s || { mode: 'system' }),
      Project.find().select('name slug category year client coverImage thumbnailImage bannerImage liveUrl githubUrl enabled order').sort({ order: 1 }).lean(),
      Service.find().sort({ order: 1 }).lean(),
      Skill.find().sort({ category: 1, order: 1 }).lean(),
      Experience.find().sort({ order: 1 }).lean(),
      FAQ.find().sort({ order: 1 }).lean(),
      Testimonial.find().sort({ order: 1 }).lean()
    ]);

    // Enforce 1000ms max query timeout so API never hangs
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 1000)
    );

    const [
      navbar, hero, about, resume, contact, footer, seo, globalSettings, theme,
      projects, services, skills, experiences, faqs, testimonials
    ] = await Promise.race([queryPromise, timeoutPromise]);

    cachedBootstrapPayload = {
      settings: {
        navbar, hero, about, resume, contact, footer, seo, global: globalSettings, theme
      },
      projects,
      services,
      skills,
      experiences,
      faqs,
      testimonials
    };
    lastBootstrapFetch = now;

    res.json(cachedBootstrapPayload);
  } catch (error) {
    console.warn('Bootstrap DB fetch fallback:', error.message);
    if (!cachedBootstrapPayload) {
      cachedBootstrapPayload = buildFallbackPayload();
    }
    res.json(cachedBootstrapPayload);
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
  theme: ThemeSettings
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
        theme: 'themeSettings'
      };
      const key = settingsKeyMap[modKey];
      return res.json(seed[key] || {});
    }
    let settings = await model.findOne().lean();
    if (!settings) {
      settings = await model.create({});
    }
    res.json(settings);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed[`${modKey}Settings`] || {});
  }
});

router.put('/settings/:module', protect, async (req, res) => {
  const model = moduleMap[req.params.module];
  if (!model) return res.status(404).json({ message: 'Module settings configuration not found' });
  try {
    let settings = await model.findOne();
    if (!settings) {
      settings = new model(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    invalidateBootstrapCache();
    invalidateMaintenanceCache();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      return res.json(seed.projects || []);
    }
    const projects = await Project.find()
      .select('name slug category year client coverImage thumbnailImage bannerImage liveUrl githubUrl enabled order')
      .sort({ order: 1 })
      .lean();
    res.json(projects);
  } catch {
    const seed = getDefaultSeedData();
    res.json(seed.projects || []);
  }
});

router.get('/projects/:idOrSlug', checkMaintenance, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const seed = getDefaultSeedData();
      const found = (seed.projects || []).find(p => p.slug === req.params.idOrSlug || p.id === req.params.idOrSlug || String(p._id) === req.params.idOrSlug);
      if (!found) return res.status(404).json({ message: 'Project not found' });
      return res.json(found);
    }
    const query = req.params.idOrSlug.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.idOrSlug }
      : { slug: req.params.idOrSlug };
    const project = await Project.findOne(query).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    const seed = getDefaultSeedData();
    const found = (seed.projects || []).find(p => p.slug === req.params.idOrSlug || p.id === req.params.idOrSlug || String(p._id) === req.params.idOrSlug);
    if (!found) return res.status(404).json({ message: 'Project not found' });
    res.json(found);
  }
});

router.post('/projects', protect, async (req, res) => {
  try {
    const project = await Project.create(req.body);
    invalidateBootstrapCache();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/projects/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Project not found' });

    // Delete replaced Cloudinary images
    const imageFields = ['coverImage', 'thumbnailImage', 'bannerImage', 'challengeImage', 'solutionImage', 'resultImage'];
    for (const field of imageFields) {
      if (req.body[field] && req.body[field] !== existing[field] && existing[field]?.includes('res.cloudinary.com')) {
        await deleteFromCloudinary(existing[field]);
      }
    }

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    invalidateBootstrapCache();
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/projects/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Permanently purge all Cloudinary images attached to this project
    await deleteCloudinaryAssetsFromObject(project);

    await Project.findByIdAndDelete(req.params.id);
    invalidateBootstrapCache();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* ── FAQ CRUD ENDPOINTS ─────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

router.get('/faqs', checkMaintenance, async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1 }).lean();
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const testimonials = await Testimonial.find().sort({ order: 1 }).lean();
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    // 1. Fetch contact settings
    const contactSettings = await ContactSettings.findOne() || {
      email: 'avfaheeem@gmail.com',
      phone: '+91 7356164236',
      whatsapp: '+91 7356164236',
      enableForm: true,
      enableAutoReply: true
    };

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
    messageRateLimits.set(ip, now);

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

    // 4. Input Sanitization (strip HTML tags to prevent XSS)
    const sanitize = (text) => typeof text === 'string' ? text.replace(/<[^>]*>/g, '').trim() : '';
    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanPhone = sanitize(phone);
    const cleanService = sanitize(serviceRequired);
    const cleanSubject = sanitize(subject || 'Portfolio Inquiry');
    const cleanMessage = sanitize(messageText);

    // 5. Save to MongoDB
    const newMessage = await Message.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      serviceRequired: cleanService,
      subject: cleanSubject,
      message: cleanMessage
    });

    // 6. Trigger Asynchronous Nodemailer Notifications
    // (We run these concurrently in background so we don't delay the user response)
    Promise.allSettled([
      sendAdminEmail(contactSettings, newMessage),
      sendVisitorAutoReply(contactSettings, newMessage)
    ]).then(results => {
      console.log('📬 Email process settled:', results.map(r => r.status));
    });

    // 7. Success Response
    res.status(201).json({ 
      success: true,
      message: 'Message sent successfully! Thank you for getting in touch.', 
      data: newMessage 
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// View Inbox (Protected)
router.get('/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
/* ── MEDIA LIBRARY CRUD ENDPOINTS ───────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────── */

// Upload File (Cloudinary Integrated, Local PDF fallback)
router.post('/media/upload', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file received' });
  try {
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    
    if (isPdf) {
      // PDF files are served locally to bypass Cloudinary strict PDF restrictions/401 blocks
      const media = await Media.create({
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: 'pdf',
        fileSize: req.file.size,
        publicId: ''
      });
      return res.status(201).json(media);
    }

    const uploadResult = await uploadToCloudinary(req.file.path, req.file.originalname);
    
    const media = await Media.create({
      fileName: req.file.originalname,
      fileUrl: uploadResult.url,
      fileType: uploadResult.fileType,
      fileSize: uploadResult.fileSize,
      publicId: uploadResult.publicId
    });
    
    res.status(201).json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Replace File (Cloudinary Integrated, Local PDF fallback)
router.post('/media/replace/:id', protect, upload.single('file'), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  if (!req.file) return res.status(400).json({ message: 'No file received' });
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media entry not found' });

    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');

    // 1. Delete old file from Cloudinary (if publicId exists) or local filesystem
    if (media.publicId) {
      await deleteFromCloudinary(media.publicId, media.fileType);
    } else if (media.fileUrl && media.fileUrl.startsWith('/uploads')) {
      const localPath = path.join(__dirname, '../..', media.fileUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    if (isPdf) {
      // Direct local PDF fallback
      media.fileName = req.file.originalname;
      media.fileUrl = `/uploads/${req.file.filename}`;
      media.fileType = 'pdf';
      media.fileSize = req.file.size;
      media.publicId = '';
      await media.save();
      return res.json(media);
    }

    // 2. Upload new file to Cloudinary (if not PDF)
    const uploadResult = await uploadToCloudinary(req.file.path, req.file.originalname);

    // 3. Update database record
    media.fileName = req.file.originalname;
    media.fileUrl = uploadResult.url;
    media.fileType = uploadResult.fileType;
    media.fileSize = uploadResult.fileSize;
    media.publicId = uploadResult.publicId;
    await media.save();

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Media Files
router.get('/media', checkMaintenance, async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 }).lean();
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Media File (Cloudinary Integrated, Local PDF fallback)
router.delete('/media/:id', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media entry not found' });

    // Delete from Cloudinary or local filesystem
    if (media.publicId) {
      await deleteFromCloudinary(media.publicId, media.fileType || '');
    } else if (media.fileUrl && media.fileUrl.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(media.fileUrl, media.fileType || '');
    } else if (media.fileUrl && media.fileUrl.startsWith('/uploads')) {
      const localPath = path.join(__dirname, '../..', media.fileUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
