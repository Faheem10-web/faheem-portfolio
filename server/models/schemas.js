import mongoose from 'mongoose';

// 1. Navbar Settings Schema
const navbarSettingsSchema = new mongoose.Schema({
  logoText: { type: String, default: 'FAHEEM' },
  logoImage: { type: String, default: '' },
  navItems: [{
    label: { type: String, required: true },
    href: { type: String, required: true },
    isRouter: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true }
  }],
  showNavbar: { type: Boolean, default: true },
  downloadCvBtnText: { type: String, default: 'Download CV' },
  downloadCvBtnVisible: { type: Boolean, default: true },
  themeToggleVisible: { type: Boolean, default: true },
  stickyNavbar: { type: Boolean, default: true }
});
export const NavbarSettings = mongoose.models.NavbarSettings || mongoose.model('NavbarSettings', navbarSettingsSchema);

// 2. Hero Section Schema
const heroSettingsSchema = new mongoose.Schema({
  greeting: { type: String, default: 'I AM' },
  name: { type: String, default: 'Faheem' },
  words: { type: [String], default: ['Faheem', 'a UI/UX Designer', 'a Frontend Developer'] },
  title1: { type: String, default: 'Designing Future' },
  title2: { type: String, default: 'Digital Experiences' },
  description: { type: String, default: 'I create premium digital experiences with modern UI/UX design, scalable React development, smooth interactions and high-performance websites.' },
  heroImage: { type: String, default: '' },
  bgImage: { type: String, default: '' },
  bgVideo: { type: String, default: '' },
  ctaText1: { type: String, default: '' },
  ctaLink1: { type: String, default: '' },
  ctaText2: { type: String, default: '' },
  ctaLink2: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  availabilityText: { type: String, default: 'Available for new projects' }
});
export const HeroSettings = mongoose.models.HeroSettings || mongoose.model('HeroSettings', heroSettingsSchema);

// 3. About Section Schema
const aboutSettingsSchema = new mongoose.Schema({
  title: { type: String, default: 'Interested in working together?' },
  subtitle: { type: String, default: 'Download my resume to learn more about my experience and qualifications.' },
  description: { type: String, default: '' },
  experienceYears: { type: Number, default: 3 },
  stats: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }],
  aboutImage: { type: String, default: '' },
  skillsSummary: { type: String, default: '' }
});
export const AboutSettings = mongoose.models.AboutSettings || mongoose.model('AboutSettings', aboutSettingsSchema);

// 4. Resume Schema
const resumeSettingsSchema = new mongoose.Schema({
  resumeUrl: { type: String, default: '/resume.pdf' },
  version: { type: String, default: '1.0.0' },
  fileName: { type: String, default: 'resume.pdf' }
});
export const ResumeSettings = mongoose.models.ResumeSettings || mongoose.model('ResumeSettings', resumeSettingsSchema);

// 5. Service Schema
const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  iconName: { type: String, default: 'FiCpu' },
  color: { type: String, default: '#8B5CF6' },
  iconType: { type: String, enum: ['iconName', 'svgCode'], default: 'iconName' },
  iconSvg: { type: String, default: '' },
  order: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
  imageUrl: { type: String, default: '' },
  bgColor: { type: String, default: '#e7eae0' },
  skills: { type: [String], default: [] }
});
serviceSchema.index({ order: 1, enabled: 1 });
export const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

// 6. Skill Schema
const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, default: 'Design' }, // Design, Development, Tools
  percentage: { type: Number, required: true, default: 80 },
  iconName: { type: String, default: 'FiCode' },
  order: { type: Number, default: 0 }
});
skillSchema.index({ category: 1, order: 1 });
export const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema);

// 7. Experience Schema
const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  duration: { type: String, required: true }, // e.g. "2024 - Present"
  description: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  website: { type: String, default: '' },
  order: { type: Number, default: 0 }
});
experienceSchema.index({ order: 1 });
export const Experience = mongoose.models.Experience || mongoose.model('Experience', experienceSchema);

// 8. Project Schema
const galleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, default: '' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  year: { type: String, required: true },
  client: { type: String, default: 'Internal' },
  status: { type: String, default: 'Completed' },
  technologies: { type: [String], default: [] },
  shortDesc: { type: String, required: true },
  longDesc: { type: String, default: '' },
  liveUrl: { type: String, default: '' },
  caseStudyUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  thumbnailImage: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  gallery: { type: [String], default: [] },
  challenge: { type: String, default: '' },
  solution: { type: String, default: '' },
  process: { type: String, default: '' },
  research: { type: String, default: '' },
  wireframes: { type: String, default: '' },
  designSystem: { type: String, default: '' },
  finalScreens: { type: String, default: '' },
  results: { type: String, default: '' },
  challengeImage: { type: String, default: '' },
  solutionImage: { type: String, default: '' },
  resultImage: { type: String, default: '' },
  challengeImages: { type: [galleryImageSchema], default: [] },
  solutionImages: { type: [galleryImageSchema], default: [] },
  resultImages: { type: [galleryImageSchema], default: [] },
  testimonial: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  showOnHome: { type: Boolean, default: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
});
projectSchema.index({ order: 1, enabled: 1 });
projectSchema.index({ isFeatured: 1, showOnHome: 1 });
projectSchema.index({ category: 1 });
export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

// 9. FAQ Schema
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  order: { type: Number, default: 0 }
});
faqSchema.index({ order: 1 });
export const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', faqSchema);

// 10. Testimonial Schema
const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, default: '' },
  company: { type: String, default: '' },
  review: { type: String, required: true },
  photoUrl: { type: String, default: '' },
  order: { type: Number, default: 0 }
});
testimonialSchema.index({ order: 1 });
export const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);

// 11. Contact Settings Schema
const contactSettingsSchema = new mongoose.Schema({
  heading: { type: String, default: 'Let\'s collaborate' },
  description: { type: String, default: 'Have a project in mind or want to say hello? Drop a message below.' },
  email: { type: String, default: 'avfaheeem@gmail.com' },
  phone: { type: String, default: '+91 7356164236' },
  whatsapp: { type: String, default: '+91 7356164236' },
  address: { type: String, default: 'Bangalore, India' },
  mapUrl: { type: String, default: '' },
  emailSubject: { type: String, default: 'New Portfolio Contact - {{name}}' },
  enableAutoReply: { type: Boolean, default: true },
  enableWhatsappButton: { type: Boolean, default: true },
  enableForm: { type: Boolean, default: true }
});
export const ContactSettings = mongoose.models.ContactSettings || mongoose.model('ContactSettings', contactSettingsSchema);

// 12. Message Schema
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  serviceRequired: { type: String, default: '' },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isRead: 1 });
export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// 13. Footer Settings Schema
const footerSettingsSchema = new mongoose.Schema({
  logoText: { type: String, default: 'FAHEEM' },
  copyrightText: { type: String, default: '© 2026 Faheem. All Rights Reserved.' },
  description: { type: String, default: 'Creating high performance premium web applications.' },
  navLinks: [{
    label: { type: String, required: true },
    href: { type: String, required: true }
  }],
  socialLinks: [{
    platform: { type: String, required: true },
    url: { type: String, required: true }
  }],
  contactEmail: { type: String, default: 'hello@faheem.design' },
  bgVideo: { type: String, default: '/assets/footer-bg.mp4' }
});
export const FooterSettings = mongoose.models.FooterSettings || mongoose.model('FooterSettings', footerSettingsSchema);

// 14. Social Link Schema
const socialLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true }, // LinkedIn, Dribbble, GitHub, etc.
  url: { type: String, required: true },
  order: { type: Number, default: 0 }
});
socialLinkSchema.index({ order: 1 });
export const SocialLink = mongoose.models.SocialLink || mongoose.model('SocialLink', socialLinkSchema);

// 15. SEO Settings Schema
const seoSettingsSchema = new mongoose.Schema({
  siteTitle: { type: String, default: 'Faheem - Premium UI/UX Portfolio' },
  metaDescription: { type: String, default: 'Interactive and modern portfolio website showcasing dynamic frontend development and UI/UX engineering.' },
  keywords: { type: [String], default: ['portfolio', 'uiux', 'developer', 'react'] },
  favicon: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  canonicalUrl: { type: String, default: '' }
});
export const SeoSettings = mongoose.models.SeoSettings || mongoose.model('SeoSettings', seoSettingsSchema);

// 16. Global Settings Schema
const globalSettingsSchema = new mongoose.Schema({
  portfolioName: { type: String, default: 'Faheem' },
  websiteUrl: { type: String, default: 'https://faheem.design' },
  primaryColor: { type: String, default: '#8B5CF6' },
  secondaryColor: { type: String, default: '#0a0a0f' },
  accentColor: { type: String, default: '#fbbf24' },
  loaderText: { type: String, default: 'DESIGNING FUTURE' },
  loaderLogo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  maintenanceMode: { type: Boolean, default: false },
  googleAnalyticsId: { type: String, default: '' }
});
export const GlobalSettings = mongoose.models.GlobalSettings || mongoose.model('GlobalSettings', globalSettingsSchema);

// 17. Media Library Schema
const mediaSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  publicId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
mediaSchema.index({ createdAt: -1 });
export const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);

// 18. Theme Settings Schema
const themeSettingsSchema = new mongoose.Schema({
  mode: { type: String, default: 'system' } // 'system', 'user', 'light', 'dark'
});
export const ThemeSettings = mongoose.models.ThemeSettings || mongoose.model('ThemeSettings', themeSettingsSchema);

// 19. Chat Widget Settings Schema
const chatSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  headerTitle: { type: String, default: 'Faheem' },
  headerStatusText: { type: String, default: 'Online • Replies in minutes' },
  headerBgColor: { type: String, default: '#0F8C6E' },
  headerTextColor: { type: String, default: '#ffffff' },
  
  // Floating Pill Trigger Button
  buttonText: { type: String, default: 'Quick Chat' },
  buttonBgColor: { type: String, default: '#0d0d11' },
  buttonTextColor: { type: String, default: '#ffffff' },
  buttonBorderColor: { type: String, default: 'rgba(255, 255, 255, 0.14)' },
  buttonIconColor: { type: String, default: '#25D366' },
  buttonDotColor: { type: String, default: '#10B981' },

  // Chat Window & Messages
  chatBgColor: { type: String, default: '#0b0b0f' },
  welcomeBubbleBg: { type: String, default: '#1E1F26' },
  welcomeMessageLine1: { type: String, default: "Hi there! 👋 I'm Faheem, UI/UX Designer & Front-End Developer." },
  welcomeMessageLine2: { type: String, default: "How can I help you with your web or mobile project today?" },
  fontFamily: { type: String, default: 'Plus Jakarta Sans' },

  // Quick Action Options
  quickAction1Text: { type: String, default: '💬 Custom Web / UI Design' },
  quickAction1Message: { type: String, default: "Hi Faheem, I'd like to discuss a Custom Web / UI Design project." },
  quickAction2Text: { type: String, default: '🚀 Hire for a Project' },
  quickAction2Message: { type: String, default: "Hi Faheem, I'd like to hire you for a project." },
  quickAction3Text: { type: String, default: '💰 Pricing & Quotation' },
  quickAction3Message: { type: String, default: "Hi Faheem, I'd like to ask about pricing and quotations." }
});
export const ChatSettings = mongoose.models.ChatSettings || mongoose.model('ChatSettings', chatSettingsSchema);

