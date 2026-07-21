import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel serverless, the filesystem is read-only except /tmp.
// Use /tmp for uploads in production, local uploads/ dir otherwise.
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../../uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('⚠️ Could not create upload directory:', err.message);
}

// Define disk storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Ensure dir exists at request time too (cold start edge case)
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {
      // Ignore — Cloudinary upload will handle the file anyway
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
  }
});

// Check file formats strictly
const checkFileTypes = (file, cb) => {
  const allowedExts = /jpg|jpeg|png|webp|svg|gif|mp4|pdf/;
  const isExtValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  
  // Accept standard browser and media types
  const allowedMimeTypes = /image|video\/mp4|application\/pdf/;
  const isMimeValid = allowedMimeTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid format! Only JPG, PNG, WEBP, SVG, GIF, MP4, and PDF files are supported.'));
  }
};

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    checkFileTypes(file, cb);
  },
  limits: { fileSize: 50 * 1024 * 1024 } // limit file size to 50MB for video/PDF compatibility
});

export default upload;
