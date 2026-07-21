import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

/**
 * Uploads a local file to Cloudinary and deletes the local file.
 * Returns the secure optimized url and public_id.
 */
export const uploadToCloudinary = async (localFilePath, originalName) => {
  try {
    // Detect resource type from extension
    const extension = originalName.split('.').pop().toLowerCase();
    let resourceType = 'auto';

    if (extension === 'pdf') {
      // Storing PDFs as raw or image. Raw is best for direct downloads,
      // but 'image' resource type lets Cloudinary generate preview thumbs.
      // Let's use 'auto' which handles it beautifully.
      resourceType = 'auto';
    }

    const uploadOptions = {
      folder: 'portfolio_media',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true
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
      fileSize: result.bytes,
      fileType: result.format || extension
    };
  } catch (error) {
    console.error('❌ Cloudinary Upload Error:', error);
    // Ensure local file is removed in case of failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
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
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: isPdf ? 'raw' : 'image' });
    
    if (result.result !== 'ok' && !isPdf) {
      // Retry with raw resource type if image type returned not found
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
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

  scan(obj);

  for (const url of urlsToDelete) {
    await deleteFromCloudinary(url);
  }
};

