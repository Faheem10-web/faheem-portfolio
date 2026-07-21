import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
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
  FooterSettings,
  SeoSettings,
  GlobalSettings,
  Media,
  ThemeSettings
} from '../models/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for seeding singleton schemas
const seedSingleton = async (Model, data) => {
  await Model.deleteMany({});
  if (data) {
    const doc = Array.isArray(data) ? data[0] : data;
    if (doc) {
      const clean = { ...doc };
      delete clean._id;
      delete clean.__v;
      await Model.create(clean);
    }
  }
};

// Helper for seeding list schemas
const seedMany = async (Model, dataArray) => {
  await Model.deleteMany({});
  if (dataArray && Array.isArray(dataArray) && dataArray.length > 0) {
    const cleanDocs = dataArray.map(doc => {
      const clean = { ...doc };
      delete clean._id;
      delete clean.__v;
      return clean;
    });
    await Model.insertMany(cleanDocs);
  }
};

/**
 * Imports CMS data JSON into the database.
 */
export const importDb = async (jsonData) => {
  // 1. Seed Singletons
  await seedSingleton(NavbarSettings, jsonData.navbarSettings);
  await seedSingleton(HeroSettings, jsonData.heroSettings);
  await seedSingleton(AboutSettings, jsonData.aboutSettings);
  await seedSingleton(ResumeSettings, jsonData.resumeSettings);
  await seedSingleton(ContactSettings, jsonData.contactSettings);
  await seedSingleton(FooterSettings, jsonData.footerSettings);
  await seedSingleton(SeoSettings, jsonData.seoSettings);
  await seedSingleton(GlobalSettings, jsonData.globalSettings);
  await seedSingleton(ThemeSettings, jsonData.themeSettings);

  // 2. Seed Lists
  await seedMany(Service, jsonData.services);
  await seedMany(Project, jsonData.projects);
  await seedMany(Skill, jsonData.skills);
  await seedMany(FAQ, jsonData.faqs);
  await seedMany(Testimonial, jsonData.testimonials);
  await seedMany(Media, jsonData.media);
  
  if (jsonData.experiences) {
    await seedMany(Experience, jsonData.experiences);
  } else {
    await Experience.deleteMany({});
  }

  // 3. Seed Users
  if (jsonData.users && Array.isArray(jsonData.users) && jsonData.users.length > 0) {
    await User.deleteMany({});
    for (const u of jsonData.users) {
      const clean = { ...u };
      delete clean._id;
      delete clean.__v;
      await User.create(clean);
    }
  } else {
    // Default fallback admin user from env variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
    let user = await User.findOne({ role: 'admin' });
    if (!user) {
      await User.create({
        username: adminUsername,
        password: adminPassword,
        role: 'admin'
      });
    }
  }
};

/**
 * Exports all CMS collections to an object.
 */
export const exportDb = async () => {
  const navbarSettings = await NavbarSettings.find().lean();
  const heroSettings = await HeroSettings.find().lean();
  const aboutSettings = await AboutSettings.find().lean();
  const resumeSettings = await ResumeSettings.find().lean();
  const contactSettings = await ContactSettings.find().lean();
  const footerSettings = await FooterSettings.find().lean();
  const seoSettings = await SeoSettings.find().lean();
  const globalSettings = await GlobalSettings.find().lean();
  const themeSettings = await ThemeSettings.find().lean();
  
  const services = await Service.find().sort({ order: 1 }).lean();
  const projects = await Project.find().sort({ order: 1 }).lean();
  const skills = await Skill.find().sort({ category: 1, order: 1 }).lean();
  const faqs = await FAQ.find().sort({ order: 1 }).lean();
  const testimonials = await Testimonial.find().sort({ order: 1 }).lean();
  const media = await Media.find().sort({ createdAt: -1 }).lean();
  const experiences = await Experience.find().sort({ order: 1 }).lean();
  const users = await User.find().lean();

  return {
    navbarSettings,
    heroSettings,
    aboutSettings,
    resumeSettings,
    contactSettings,
    footerSettings,
    seoSettings,
    globalSettings,
    themeSettings,
    services,
    projects,
    skills,
    faqs,
    testimonials,
    media,
    experiences,
    users
  };
};

import mongoose from 'mongoose';

export const autoSeedDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.log('ℹ️ MongoDB is offline/disconnected. Skipping auto-seeding.');
    return;
  }
  try {
    const navbarCount = await NavbarSettings.countDocuments();
    const projectCount = await Project.countDocuments();
    const serviceCount = await Service.countDocuments();
    const userCount = await User.countDocuments();

    if (navbarCount === 0 && projectCount === 0 && serviceCount === 0 && userCount === 0) {
      console.log('🔄 Database is empty. Attempting auto-seeding...');
      
      const seedFile = path.join(__dirname, '../data/seedData.json');
      const defaultSeedFile = path.join(__dirname, '../data/defaultSeedData.json');
      
      let dataPath = defaultSeedFile;
      if (fs.existsSync(seedFile)) {
        console.log('📂 Found user seedData.json. Seeding from it...');
        dataPath = seedFile;
      } else {
        console.log('📂 seedData.json not found. Seeding from defaultSeedData.json...');
      }

      const raw = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(raw);
      await importDb(data);
      console.log('✅ Database auto-seeded successfully!');
    } else {
      console.log('ℹ️ Database already contains data. Skipping auto-seeding.');
    }
  } catch (err) {
    console.error('❌ Database auto-seeding error:', err.message);
  }
};
