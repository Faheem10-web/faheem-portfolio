import fs from 'fs';
import path from 'path';

/**
 * Default fallback SEO configuration
 */
export const DEFAULT_SEO_METADATA = {
  siteTitle: 'Faheem - Premium UI/UX Portfolio',
  metaDescription: 'Interactive and modern portfolio website showcasing dynamic frontend development and UI/UX engineering.',
  keywords: ['portfolio', 'uiux', 'developer', 'react', 'faheem'],
  canonicalUrl: 'https://faheem.design',
  author: 'Faheem',
  robotsIndex: 'index, follow',
  ogTitle: 'Faheem - Lead UI/UX Designer & Frontend Developer',
  ogDescription: 'Explore interactive case studies, design systems, and digital product designs.',
  ogImage: '',
  twitterTitle: 'Faheem - Lead UI/UX Designer & Frontend Developer',
  twitterDescription: 'Explore interactive case studies, design systems, and digital product designs.',
  twitterImage: '',
  twitterUseOgImage: true,
  twitterCardType: 'summary_large_image',
  favicon: ''
};

/**
 * Injects or replaces Open Graph, Twitter Cards, and SEO meta tags inside HTML template string
 */
export function injectSeoMetadataToHtml(html, seoData = {}) {
  const seo = { ...DEFAULT_SEO_METADATA, ...(seoData || {}) };

  const siteTitle = seo.siteTitle || DEFAULT_SEO_METADATA.siteTitle;
  const metaDescription = seo.metaDescription || DEFAULT_SEO_METADATA.metaDescription;
  
  const keywordsStr = Array.isArray(seo.keywords) 
    ? seo.keywords.join(', ') 
    : (seo.keywords || DEFAULT_SEO_METADATA.keywords.join(', '));
    
  const author = seo.author || DEFAULT_SEO_METADATA.author;
  const robots = seo.robotsIndex || DEFAULT_SEO_METADATA.robotsIndex;
  const canonical = seo.canonicalUrl || DEFAULT_SEO_METADATA.canonicalUrl;

  const ogTitle = seo.ogTitle || siteTitle;
  const ogDesc = seo.ogDescription || metaDescription;
  const ogImg = seo.ogImage || '';

  const twitterImg = seo.twitterUseOgImage !== false ? (ogImg || seo.twitterImage) : (seo.twitterImage || ogImg);
  const twitterTitle = seo.twitterTitle || ogTitle;
  const twitterDesc = seo.twitterDescription || ogDesc;
  const twitterCardType = seo.twitterCardType || 'summary_large_image';

  const favicon = seo.favicon || '/favicon.ico';

  let updatedHtml = html;

  // Helper to replace or insert meta tag
  const replaceOrInsertMeta = (attrName, attrVal, contentVal) => {
    if (!contentVal && contentVal !== '') return;
    const regex = new RegExp(`<meta\\s+${attrName}=["']${attrVal}["']\\s+content=["'][^"']*["']\\s*\\/?>`, 'gi');
    const newTag = `<meta ${attrName}="${attrVal}" content="${escapeHtml(contentVal)}" />`;
    if (regex.test(updatedHtml)) {
      updatedHtml = updatedHtml.replace(regex, newTag);
    } else {
      updatedHtml = updatedHtml.replace('</head>', `  ${newTag}\n</head>`);
    }
  };

  // Helper to replace or insert link tag
  const replaceOrInsertLink = (relVal, hrefVal) => {
    if (!hrefVal) return;
    const regex = new RegExp(`<link\\s+rel=["']${relVal}["']\\s+href=["'][^"']*["']\\s*\\/?>`, 'gi');
    const newTag = `<link rel="${relVal}" href="${escapeHtml(hrefVal)}" />`;
    if (regex.test(updatedHtml)) {
      updatedHtml = updatedHtml.replace(regex, newTag);
    } else {
      updatedHtml = updatedHtml.replace('</head>', `  ${newTag}\n</head>`);
    }
  };

  // 1. Replace <title>
  const titleRegex = /<title>[^<]*<\/title>/gi;
  const newTitleTag = `<title>${escapeHtml(siteTitle)}</title>`;
  if (titleRegex.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(titleRegex, newTitleTag);
  } else {
    updatedHtml = updatedHtml.replace('</head>', `  ${newTitleTag}\n</head>`);
  }

  // 2. Standard Meta Tags
  replaceOrInsertMeta('name', 'title', siteTitle);
  replaceOrInsertMeta('name', 'description', metaDescription);
  replaceOrInsertMeta('name', 'keywords', keywordsStr);
  replaceOrInsertMeta('name', 'author', author);
  replaceOrInsertMeta('name', 'robots', robots);
  replaceOrInsertLink('canonical', canonical);

  // 3. Open Graph Meta Tags (WhatsApp, Facebook, LinkedIn, Discord, Telegram)
  replaceOrInsertMeta('property', 'og:type', 'website');
  replaceOrInsertMeta('property', 'og:url', canonical);
  replaceOrInsertMeta('property', 'og:site_name', 'Faheem Portfolio');
  replaceOrInsertMeta('property', 'og:title', ogTitle);
  replaceOrInsertMeta('property', 'og:description', ogDesc);
  if (ogImg) {
    replaceOrInsertMeta('property', 'og:image', ogImg);
    replaceOrInsertMeta('property', 'og:image:secure_url', ogImg);
    replaceOrInsertMeta('property', 'og:image:width', '1200');
    replaceOrInsertMeta('property', 'og:image:height', '630');
  }

  // 4. Twitter Cards / X
  replaceOrInsertMeta('name', 'twitter:card', twitterCardType);
  replaceOrInsertMeta('name', 'twitter:url', canonical);
  replaceOrInsertMeta('name', 'twitter:title', twitterTitle);
  replaceOrInsertMeta('name', 'twitter:description', twitterDesc);
  if (twitterImg) {
    replaceOrInsertMeta('name', 'twitter:image', twitterImg);
  }

  // 5. Favicon
  if (favicon) {
    replaceOrInsertLink('icon', favicon);
    replaceOrInsertLink('shortcut icon', favicon);
    replaceOrInsertLink('apple-touch-icon', favicon);
  }

  return updatedHtml;
}

/**
 * Escapes special HTML characters to prevent XSS in meta tag content attributes
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Persists SEO metadata to static JSON cache file for zero-latency server fallback
 */
export function saveSeoJsonCache(seoData, rootDir = process.cwd()) {
  try {
    const jsonStr = JSON.stringify(seoData, null, 2);
    const targets = [
      path.join(rootDir, 'public', 'seo-metadata.json'),
      path.join(rootDir, 'dist', 'seo-metadata.json')
    ];

    for (const filePath of targets) {
      const dir = path.dirname(filePath);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(filePath, jsonStr, 'utf-8');
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not write static seo-metadata.json cache:', err.message);
  }
}

/**
 * Loads static SEO metadata JSON cache
 */
export function loadSeoJsonCache(rootDir = process.cwd()) {
  const targets = [
    path.join(rootDir, 'public', 'seo-metadata.json'),
    path.join(rootDir, 'dist', 'seo-metadata.json')
  ];

  for (const filePath of targets) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      } catch {
        // ignore parse error
      }
    }
  }
  return DEFAULT_SEO_METADATA;
}
