import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from '../config/db.js';
import { Settings } from '../models/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const bannerUrl = 'https://res.cloudinary.com/ddluoarzr/image/upload/v1785579659/share_banner_fjefcp.png';
    const publicId = 'share_banner_fjefcp';
    const updatedAt = new Date();

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    settings.shareBanner = {
      imageUrl: bannerUrl,
      publicId: publicId,
      updatedAt: updatedAt
    };

    await settings.save();
    console.log('✓ MongoDB Settings document updated with new Share Banner URL!');

    // Sync index.html static Open Graph meta tags
    const timestamp = updatedAt.getTime();
    const versionedUrl = `${bannerUrl}?v=${timestamp}`;
    const htmlPaths = [
      path.join(__dirname, '../../index.html'),
      path.join(__dirname, '../../dist/index.html')
    ];

    for (const htmlPath of htmlPaths) {
      if (fs.existsSync(htmlPath)) {
        let content = fs.readFileSync(htmlPath, 'utf-8');
        content = content.replace(/<meta property="og:image" content="[^"]*"/gi, `<meta property="og:image" content="${versionedUrl}"`);
        content = content.replace(/<meta property="og:image:secure_url" content="[^"]*"/gi, `<meta property="og:image:secure_url" content="${versionedUrl}"`);
        content = content.replace(/<meta property="og:image:type" content="[^"]*"/gi, `<meta property="og:image:type" content="image/png"`);
        content = content.replace(/<meta name="twitter:image" content="[^"]*"/gi, `<meta name="twitter:image" content="${versionedUrl}"`);
        content = content.replace(/"image":\s*"[^"]*"/gi, `"image": "${versionedUrl}"`);
        fs.writeFileSync(htmlPath, content, 'utf-8');
      }
    }
    console.log('✓ index.html & dist/index.html meta tags updated!');
    console.log('🎉 Share banner update complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating share banner URL:', err);
    process.exit(1);
  }
};

run();
