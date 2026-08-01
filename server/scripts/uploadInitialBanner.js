import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from '../config/db.js';
import { Settings } from '../models/schemas.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const imagePath = path.join(__dirname, '../../public/share-banner-preview.png');
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Image file not found:', imagePath);
      process.exit(1);
    }

    console.log('Uploading share banner image to Cloudinary folder portfolio/share-banner...');
    const uploadResult = await uploadToCloudinary(imagePath, 'share_banner_preview.png', 'portfolio/share-banner');

    if (!uploadResult || !uploadResult.url) {
      console.error('❌ Upload failed.');
      process.exit(1);
    }

    console.log('✓ Cloudinary Upload Successful:', uploadResult.url);

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    const updatedAt = new Date();
    settings.shareBanner = {
      imageUrl: uploadResult.url,
      publicId: uploadResult.publicId || uploadResult.public_id || '',
      updatedAt: updatedAt
    };

    await settings.save();
    console.log('✓ Settings document updated in MongoDB Atlas!');

    // Sync index.html static Open Graph meta tags
    const timestamp = updatedAt.getTime();
    const versionedUrl = `${uploadResult.url}?v=${timestamp}`;
    const htmlPaths = [
      path.join(__dirname, '../../index.html'),
      path.join(__dirname, '../../dist/index.html')
    ];

    for (const htmlPath of htmlPaths) {
      if (fs.existsSync(htmlPath)) {
        let content = fs.readFileSync(htmlPath, 'utf-8');
        content = content.replace(/<meta property="og:image" content="[^"]*"/gi, `<meta property="og:image" content="${versionedUrl}"`);
        content = content.replace(/<meta property="og:image:secure_url" content="[^"]*"/gi, `<meta property="og:image:secure_url" content="${versionedUrl}"`);
        content = content.replace(/<meta name="twitter:image" content="[^"]*"/gi, `<meta name="twitter:image" content="${versionedUrl}"`);
        content = content.replace(/"image":\s*"[^"]*"/gi, `"image": "${versionedUrl}"`);
        fs.writeFileSync(htmlPath, content, 'utf-8');
      }
    }
    console.log('✓ index.html & dist/index.html meta tags updated!');
    console.log('🎉 Share banner initial upload complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error uploading initial share banner:', err);
    process.exit(1);
  }
};

run();
