import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

/**
 * Uploads a local file to Cloudinary and deletes the local file.
 * Falls back gracefully to local uploads storage if Cloudinary network upload fails.
 * Returns the secure optimized url and public_id.
 */
export const uploadToCloudinary = async (localFilePath, originalName) => {
  const extension = originalName ? originalName.split('.').pop().toLowerCase() : 'jpg';

  try {
    let resourceType = 'auto';

    const uploadOptions = {
      folder: 'portfolio_media',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      invalidate: true
    };

    // Perform upload
    const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);

    // Clean up local temp file synchronously
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    // Embed Cloudinary auto-format (f_auto) and auto-quality (q_auto) for optimized delivery (skip for documents like PDFs)
    let optimizedUrl = result.secure_url;
    const isDoc = ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension) || 
                  (result.format && ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(result.format.toLowerCase()));
    
    if (result.resource_type === 'image' && optimizedUrl.includes('/upload/') && !isDoc) {
      optimizedUrl = optimizedUrl.replace('/upload/', '/upload/f_auto,q_auto/');
    }

    return {
      success: true,
      url: optimizedUrl,
      publicId: result.public_id,
      public_id: result.public_id,
      fileSize: result.bytes,
      fileType: result.format || extension,
      version: result.version
    };
  } catch (error) {
    console.error('⚠️ Cloudinary Upload Error (falling back to local storage):', error.message || error);
    
    try {
      const fileName = path.basename(localFilePath);
      const targetDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const targetPath = path.join(targetDir, fileName);
      if (localFilePath !== targetPath && fs.existsSync(localFilePath)) {
        fs.copyFileSync(localFilePath, targetPath);
        fs.unlinkSync(localFilePath);
      }
      
      const localUrl = `/uploads/${fileName}`;
      return {
        success: true,
        url: localUrl,
        publicId: `local-${Date.now()}`,
        public_id: `local-${Date.now()}`,
        fileSize: fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0,
        fileType: extension,
        isLocalFallback: true
      };
    } catch {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      throw error;
    }
  }
};

/**
 * Extracts public_id from a Cloudinary URL.
 * Handles transformed URLs (f_auto,q_auto) and folder structures.
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let path = url.substring(uploadIndex + 8);
    
    // Remove transformations / version if present
    const parts = path.split('/');
    const cleanParts = parts.filter(part => {
      if (!part) return false;
      if (part.startsWith('v') && /^v\d+$/.test(part)) return false;
      if (part.includes('f_auto') || part.includes('q_auto') || part.includes('fl_')) return false;
      return true;
    });
    
    let publicIdWithExt = cleanParts.join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  } catch (e) {
    console.error('Error extracting public_id from Cloudinary URL:', e);
    return null;
  }
};

/**
 * Deletes an asset from Cloudinary using its public_id or full Cloudinary URL.
 */
export const deleteFromCloudinary = async (publicIdOrUrl, fileType = '') => {
  if (!publicIdOrUrl) return { success: false, message: 'No asset provided' };

  let publicId = publicIdOrUrl;
  if (typeof publicIdOrUrl === 'string' && publicIdOrUrl.startsWith('http')) {
    publicId = extractPublicIdFromUrl(publicIdOrUrl);
  }

  if (!publicId) return { success: false, message: 'Could not resolve public_id' };
  
  try {
    const isPdf = fileType.toLowerCase() === 'pdf' || publicId.endsWith('.pdf');
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: isPdf ? 'raw' : 'image', invalidate: true });
    
    if (result.result !== 'ok' && !isPdf) {
      // Retry with raw resource type if image type returned not found
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', invalidate: true });
    }
    
    console.log(`🗑️ Cloudinary destroy result for '${publicId}':`, result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Cloudinary Delete Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Helper to delete all Cloudinary images contained in an item or document.
 */
export const deleteCloudinaryAssetsFromObject = async (obj) => {
  if (!obj || typeof obj !== 'object') return;
  const urlsToDelete = new Set();

  const scan = (val) => {
    if (!val) return;
    if (typeof val === 'string' && val.includes('res.cloudinary.com')) {
      urlsToDelete.add(val);
    } else if (Array.isArray(val)) {
      val.forEach(scan);
    } else if (typeof val === 'object') {
      Object.values(val).forEach(scan);
    }
  };

  try {
    scan(obj);

    for (const url of urlsToDelete) {
      try {
        await deleteFromCloudinary(url);
      } catch (err) {
        console.warn(`⚠️ Non-fatal Cloudinary deletion error for ${url}:`, err.message);
      }
    }
  } catch (err) {
    console.warn('⚠️ Non-fatal Cloudinary asset scan error:', err.message);
  }
};

