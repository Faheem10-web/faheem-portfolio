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
 * Deletes an asset from Cloudinary using its public_id.
 */
export const deleteFromCloudinary = async (publicId, fileType = '') => {
  if (!publicId) return { success: false, message: 'No publicId provided' };
  
  try {
    // PDFs/raw files might need resource_type: 'raw' to delete.
    // Try to delete as image first (default), then try raw if needed.
    const isPdf = fileType.toLowerCase() === 'pdf' || publicId.endsWith('.pdf');
    const resourceType = isPdf ? 'raw' : 'image';

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`🗑️ Cloudinary destroy result for ${publicId}:`, result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Cloudinary Delete Error:', error);
    return { success: false, error: error.message };
  }
};
