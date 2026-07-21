import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists in parent directory
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Define disk storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
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
