import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { injectSeoMetadataToHtml, loadSeoJsonCache, saveSeoJsonCache } from '../utils/seoInjector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');

try {
  const seoData = loadSeoJsonCache(rootDir);
  saveSeoJsonCache(seoData, rootDir);

  const distHtmlPath = path.join(rootDir, 'dist', 'index.html');
  if (fs.existsSync(distHtmlPath)) {
    const rawHtml = fs.readFileSync(distHtmlPath, 'utf-8');
    const updatedHtml = injectSeoMetadataToHtml(rawHtml, seoData);
    fs.writeFileSync(distHtmlPath, updatedHtml, 'utf-8');
    console.log('✓ Build SEO Metadata successfully injected into dist/index.html');
  }
} catch (err) {
  console.warn('⚠️ Postbuild SEO sync warning:', err.message);
}
