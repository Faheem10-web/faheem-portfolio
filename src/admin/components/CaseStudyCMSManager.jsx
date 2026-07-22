import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  FiUploadCloud, FiTrash2, FiRefreshCw, FiExternalLink, 
  FiCheck, FiX, FiMove, FiInfo, FiSave, FiAlertCircle 
} from 'react-icons/fi';

/**
 * Client-side canvas image compression (JPG/PNG/WEBP/AVIF max 15MB)
 */
async function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.88) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file; // Return SVG or non-canvas format as-is
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob && blob.size < file.size) {
            const compressedFile = new File([blob], file.name, {
              type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Keep original if compression didn't shrink size
          }
        }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

function FormatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Single Image Section Card (Hero, Challenge, Solution, Result, Conclusion)
 */
function ImageSectionCard({ 
  title, 
  subtitle,
  imageObj, 
  onSaveImage, 
  onRemoveImage 
}) {
  const { uploadCaseStudyFile, deleteCaseStudyImage } = useAdmin();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [currentXhr, setCurrentXhr] = useState(null);

  // Sync internal state when parent props update
  const currentUrl = typeof imageObj === 'string' ? imageObj : imageObj?.url || '';
  const currentPublicId = typeof imageObj === 'object' ? imageObj?.public_id || '' : '';
  const currentAlt = typeof imageObj === 'object' ? imageObj?.alt || title : title;
  const currentFilename = typeof imageObj === 'object' ? imageObj?.filename || '' : '';
  const currentSize = typeof imageObj === 'object' ? imageObj?.size || 0 : 0;
  const currentDimensions = typeof imageObj === 'object' && imageObj?.width ? `${imageObj.width} x ${imageObj.height} px` : 'Auto Responsive';

  const [altText, setAltText] = useState(currentAlt);

  useEffect(() => {
    setAltText(currentAlt);
  }, [currentAlt]);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    setErrorMessage('');

    // Validations (jpg, jpeg, png, webp, avif, svg)
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext) && !file.type.startsWith('image/')) {
      setErrorMessage('Unsupported file format. Please upload JPG, JPEG, PNG, WEBP, AVIF, or SVG.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds maximum 15MB limit.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Image compression before upload
      const optimizedFile = await compressImage(file);

      // Perform upload with progress feedback
      const res = await uploadCaseStudyFile(optimizedFile, (percent) => {
        setProgress(percent);
      });

      if (res.success && res.url) {
        const newImageObj = {
          url: res.url,
          public_id: res.public_id || '',
          alt: altText || title,
          filename: res.filename || file.name,
          width: res.width || 0,
          height: res.height || 0,
          size: res.size || file.size,
          uploadedAt: res.uploadedAt || new Date().toISOString()
        };

        setPreviewData(newImageObj);
        onSaveImage(newImageObj);
        showSuccess(`${title} uploaded and updated successfully!`);
      } else {
        setErrorMessage(res.message || 'Image upload failed. Please try again.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      setErrorMessage(err.message || 'Upload failed. Please check network.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${title}? This will also delete the asset from Cloudinary.`)) return;
    
    if (currentPublicId || currentUrl) {
      await deleteCaseStudyImage(currentPublicId || currentUrl);
    }
    setPreviewData(null);
    onRemoveImage();
    showSuccess(`${title} removed successfully.`);
  };

  const handleAltSave = () => {
    if (!currentUrl) return;
    const updated = typeof imageObj === 'object' ? { ...imageObj, alt: altText } : { url: currentUrl, alt: altText };
    onSaveImage(updated);
    showSuccess('Alt text updated.');
  };

  const inputId = `upload-input-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid #EAEAEA',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      marginBottom: '24px',
      transition: 'all 0.3s ease'
    }}>
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827' }}>{title}</h3>
          {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>{subtitle}</p>}
        </div>
        {currentUrl && (
          <span style={{ fontSize: '11px', background: '#DEF7EC', color: '#03543F', padding: '4px 10px', borderRadius: '999px', fontWeight: '600' }}>
            Active Image
          </span>
        )}
      </div>

      {/* Toast Feedback Messages */}
      {successToast && (
        <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCheck size={16} /> {successToast}
        </div>
      )}

      {errorMessage && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiAlertCircle size={16} /> {errorMessage}
        </div>
      )}

      {/* Main Image Display / Upload Container */}
      {currentUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Large Image Preview Box */}
          <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F9FAFB', maxHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={currentUrl} 
              alt={currentAlt} 
              style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', display: 'block' }} 
            />
          </div>

          {/* Image Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', background: '#F9FAFB', padding: '12px 16px', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700' }}>File Name</span>
              <div style={{ fontSize: '12.5px', color: '#1F2937', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentFilename || 'Image_Asset.jpg'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700' }}>Dimensions</span>
              <div style={{ fontSize: '12.5px', color: '#1F2937', fontWeight: '600' }}>{currentDimensions}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700' }}>File Size</span>
              <div style={{ fontSize: '12.5px', color: '#1F2937', fontWeight: '600' }}>{FormatBytes(currentSize)}</div>
            </div>
          </div>

          {/* Alt Text Field */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="text" 
              value={altText} 
              onChange={e => setAltText(e.target.value)} 
              placeholder="SEO Alt Text / Caption" 
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
            />
            <button 
              type="button" 
              onClick={handleAltSave} 
              style={{ background: '#4F46E5', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              Update Alt
            </button>
          </div>

          {/* Action Bar: Replace & Delete */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <label htmlFor={inputId} style={{ flex: 1, background: '#F3F4F6', color: '#374151', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FiRefreshCw /> Replace Image
              <input type="file" accept="image/*" id={inputId} onChange={e => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
            </label>
            <button 
              type="button" 
              onClick={handleDelete} 
              style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiTrash2 /> Remove
            </button>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? '#4F46E5' : '#D1D5DB'}`,
            borderRadius: '14px',
            padding: '32px 20px',
            textAlign: 'center',
            background: isDragging ? '#EEF2FF' : '#F9FAFB',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#4F46E5' }}>
                Uploading to Cloudinary... {progress}%
              </div>
              {/* Progress Bar */}
              <div style={{ width: '100%', maxWidth: '280px', height: '8px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#4F46E5', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <FiUploadCloud size={36} color="#9CA3AF" />
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Drag & drop your {title} asset here, or <span style={{ color: '#4F46E5', textDecoration: 'underline' }}>browse</span>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                  Supports JPG, PNG, WEBP, AVIF, SVG (Max 15MB)
                </p>
              </div>
              <label htmlFor={inputId} style={{ marginTop: '8px', background: '#4F46E5', color: '#ffffff', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}>
                Select File
                <input type="file" accept="image/*" id={inputId} onChange={e => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Unlimited Gallery Manager with Drag Reorder, Alt Text & Captions
 */
function UnlimitedGalleryCard({ galleryImages = [], onUpdateGallery }) {
  const { uploadCaseStudyFile, deleteCaseStudyImage } = useAdmin();
  const [isUploading, setIsUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const handleAddFiles = async (files) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setIsUploading(true);

    try {
      const newUploadedItems = [];
      for (const file of arr) {
        const compressed = await compressImage(file);
        const res = await uploadCaseStudyFile(compressed);
        if (res.success && res.url) {
          newUploadedItems.push({
            url: res.url,
            public_id: res.public_id || '',
            alt: file.name,
            caption: '',
            filename: file.name,
            size: file.size,
            order: (galleryImages.length + newUploadedItems.length)
          });
        }
      }

      if (newUploadedItems.length > 0) {
        onUpdateGallery([...galleryImages, ...newUploadedItems]);
      }
    } catch (e) {
      console.error('Gallery upload error:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteGalleryItem = async (indexToDelete) => {
    const target = galleryImages[indexToDelete];
    if (target && (target.public_id || target.url)) {
      await deleteCaseStudyImage(target.public_id || target.url);
    }
    const updated = galleryImages.filter((_, idx) => idx !== indexToDelete);
    onUpdateGallery(updated);
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...galleryImages];
    const item = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, item);
    setDragIndex(index);
    onUpdateGallery(updated);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #EAEAEA', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827' }}>Unlimited Case Study Gallery</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>Add extra mockups, reorder by dragging cards, or edit captions</p>
        </div>
        <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}>
          + Add Gallery Images
          <input type="file" multiple accept="image/*" onChange={e => handleAddFiles(e.target.files)} style={{ display: 'none' }} />
        </label>
      </div>

      {isUploading && (
        <div style={{ color: '#4F46E5', fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>
          ⏳ Uploading images to Cloudinary...
        </div>
      )}

      {galleryImages.length === 0 ? (
        <div style={{ padding: '32px', textStyle: 'center', textAlign: 'center', background: '#F9FAFB', borderRadius: '14px', border: '1px dashed #D1D5DB', color: '#6B7280', fontSize: '13px' }}>
          No gallery images uploaded yet. Click "+ Add Gallery Images" to attach supplementary designs.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {galleryImages.map((img, idx) => (
            <div 
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              style={{
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: 'grab'
              }}
            >
              <div style={{ position: 'relative', height: '140px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                <img src={img.url} alt={img.alt || 'Gallery item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                  #{idx + 1}
                </div>
                <button 
                  type="button" 
                  onClick={() => handleDeleteGalleryItem(idx)}
                  style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}
                >
                  <FiTrash2 />
                </button>
              </div>

              <input 
                type="text" 
                value={img.caption || ''} 
                onChange={(e) => {
                  const updated = [...galleryImages];
                  updated[idx] = { ...updated[idx], caption: e.target.value };
                  onUpdateGallery(updated);
                }} 
                placeholder="Optional Caption" 
                style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Case Study Editable Link Settings Card
 */
function LinksSettingsCard({ links = {}, onSaveLinks }) {
  const [linksState, setLinksState] = useState({
    liveProject: links.liveProject || '',
    github: links.github || '',
    figma: links.figma || '',
    behance: links.behance || '',
    dribbble: links.dribbble || '',
    prototype: links.prototype || '',
    video: links.video || ''
  });

  useEffect(() => {
    setLinksState({
      liveProject: links.liveProject || '',
      github: links.github || '',
      figma: links.figma || '',
      behance: links.behance || '',
      dribbble: links.dribbble || '',
      prototype: links.prototype || '',
      video: links.video || ''
    });
  }, [links]);

  const handleChange = (key, val) => {
    const updated = { ...linksState, [key]: val };
    setLinksState(updated);
    onSaveLinks(updated);
  };

  const linkFields = [
    { key: 'liveProject', label: 'Live Project URL', placeholder: 'https://project.faheem.design' },
    { key: 'github', label: 'GitHub Repository URL', placeholder: 'https://github.com/faheem/repo' },
    { key: 'figma', label: 'Figma File URL', placeholder: 'https://figma.com/file/...' },
    { key: 'behance', label: 'Behance Showcase URL', placeholder: 'https://behance.net/gallery/...' },
    { key: 'dribbble', label: 'Dribbble Shot URL', placeholder: 'https://dribbble.com/shots/...' },
    { key: 'prototype', label: 'Interactive Prototype URL', placeholder: 'https://proto.io/...' },
    { key: 'video', label: 'Demo Video URL (YouTube/Vimeo)', placeholder: 'https://youtube.com/watch?v=...' }
  ];

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #EAEAEA', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '700', color: '#111827' }}>Project & Case Study Links</h3>
      <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6B7280' }}>Manage live demo, code repos, Figma files, and social showcase links</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {linkFields.map(({ key, label, placeholder }) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>{label}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={linksState[key] || ''} 
                onChange={(e) => handleChange(key, e.target.value)} 
                placeholder={placeholder}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
              />
              {linksState[key] && (
                <a 
                  href={linksState[key]} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ background: '#F3F4F6', color: '#4F46E5', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Open Link"
                >
                  <FiExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Case Study CMS Manager Container Component
 */
export default function CaseStudyCMSManager({ project, onSaveComplete }) {
  const { updateCaseStudy } = useAdmin();
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [heroImage, setHeroImage] = useState(project?.heroImage || project?.bannerImage || '');
  const [challengeImage, setChallengeImage] = useState(project?.challengeImage || '');
  const [solutionImage, setSolutionImage] = useState(project?.solutionImage || '');
  const [resultImage, setResultImage] = useState(project?.resultImage || '');
  const [conclusionImage, setConclusionImage] = useState(project?.conclusionImage || '');
  const [galleryImages, setGalleryImages] = useState(project?.galleryImages || []);
  const [links, setLinks] = useState(project?.links || {
    liveProject: project?.liveUrl || '',
    github: project?.githubUrl || ''
  });

  useEffect(() => {
    if (project) {
      setHeroImage(project.heroImage || project.bannerImage || '');
      setChallengeImage(project.challengeImage || '');
      setSolutionImage(project.solutionImage || '');
      setResultImage(project.resultImage || '');
      setConclusionImage(project.conclusionImage || '');
      setGalleryImages(project.galleryImages || []);
      setLinks(project.links || {
        liveProject: project.liveUrl || '',
        github: project.githubUrl || ''
      });
    }
  }, [project]);

  const handleGlobalSave = async () => {
    if (!project?._id && !project?.slug) return;
    setIsSaving(true);

    const payload = {
      heroImage: typeof heroImage === 'object' ? heroImage.url : heroImage,
      bannerImage: typeof heroImage === 'object' ? heroImage.url : heroImage,
      challengeImage: typeof challengeImage === 'object' ? challengeImage.url : challengeImage,
      solutionImage: typeof solutionImage === 'object' ? solutionImage.url : solutionImage,
      resultImage: typeof resultImage === 'object' ? resultImage.url : resultImage,
      conclusionImage: typeof conclusionImage === 'object' ? conclusionImage.url : conclusionImage,
      galleryImages,
      links,
      liveUrl: links.liveProject || project.liveUrl,
      githubUrl: links.github || project.githubUrl
    };

    const res = await updateCaseStudy(project._id || project.slug, payload);
    setIsSaving(false);

    if (res.success) {
      setToastMessage('Case study images & links saved successfully!');
      setTimeout(() => setToastMessage(''), 3500);
      if (onSaveComplete) onSaveComplete(res.project);
    } else {
      alert(res.message || 'Failed to save case study changes.');
    }
  };

  if (!project) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' }}>
            Case Study CMS & Image Manager
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#6B7280' }}>
            Manage section mockups, hero banners, gallery items, and project links for <strong>{project.name}</strong>
          </p>
        </div>

        <button 
          type="button" 
          onClick={handleGlobalSave} 
          disabled={isSaving}
          style={{
            background: '#10B981',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}
        >
          <FiSave size={18} />
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>

      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '14px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiCheck size={18} /> {toastMessage}
        </div>
      )}

      {/* 1. Hero Banner Image Card */}
      <ImageSectionCard 
        title="Hero Banner Image" 
        subtitle="Main top wide banner displayed at the head of the case study"
        imageObj={heroImage}
        onSaveImage={setHeroImage}
        onRemoveImage={() => setHeroImage('')}
      />

      {/* 2. The Challenge Image Card */}
      <ImageSectionCard 
        title="The Challenge Image" 
        subtitle="Mockup image displayed alongside the project challenge section"
        imageObj={challengeImage}
        onSaveImage={setChallengeImage}
        onRemoveImage={() => setChallengeImage('')}
      />

      {/* 3. The Solution Image Card */}
      <ImageSectionCard 
        title="The Solution Image" 
        subtitle="Mockup image displayed alongside the project solution section"
        imageObj={solutionImage}
        onSaveImage={setSolutionImage}
        onRemoveImage={() => setSolutionImage('')}
      />

      {/* 4. The Result Image Card */}
      <ImageSectionCard 
        title="The Result Image" 
        subtitle="Mockup image displayed alongside the project results section"
        imageObj={resultImage}
        onSaveImage={setResultImage}
        onRemoveImage={() => setResultImage('')}
      />

      {/* 5. The Conclusion Image Card */}
      <ImageSectionCard 
        title="Conclusion Image" 
        subtitle="Final mockup image displayed alongside the conclusion section"
        imageObj={conclusionImage}
        onSaveImage={setConclusionImage}
        onRemoveImage={() => setConclusionImage('')}
      />

      {/* 6. Unlimited Gallery Images Card */}
      <UnlimitedGalleryCard 
        galleryImages={galleryImages}
        onUpdateGallery={setGalleryImages}
      />

      {/* 7. Editable Links Settings Card */}
      <LinksSettingsCard 
        links={links}
        onSaveLinks={setLinks}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button 
          type="button" 
          onClick={handleGlobalSave} 
          disabled={isSaving}
          style={{
            background: '#10B981',
            color: '#ffffff',
            border: 'none',
            padding: '12px 28px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}
        >
          <FiSave size={18} />
          {isSaving ? 'Saving Changes...' : 'Save All Case Study Changes'}
        </button>
      </div>
    </div>
  );
}
