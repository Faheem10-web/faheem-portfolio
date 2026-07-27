import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel serverless, the filesystem is read-only except /tmp.
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel
  ? os.tmpdir()
  : path.join(__dirname, '../../uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('⚠️ Upload directory check warning:', err.message);
}

// Define disk storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {
      // Ignore
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
  }
});

// Flexible file format checker
const checkFileTypes = (file, cb) => {
  const allowedExts = /\.(jpg|jpeg|png|webp|svg|gif|mp4|mov|webm|pdf|doc|docx|xls|xlsx|txt)$/i;
  const isExtValid = allowedExts.test(file.originalname);
  
  const isMimeValid = !file.mimetype || 
                      file.mimetype.startsWith('image/') || 
                      file.mimetype.startsWith('video/') || 
                      file.mimetype.includes('pdf') ||
                      file.mimetype.includes('document') ||
                      file.mimetype.includes('sheet') ||
                      file.mimetype.includes('text') ||
                      file.mimetype === 'application/octet-stream';

  if (isExtValid || isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload standard image, video, or document files.'));
  }
};

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    checkFileTypes(file, cb);
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export default upload;
