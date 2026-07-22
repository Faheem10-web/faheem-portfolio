import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  FiUploadCloud, FiTrash2, FiRefreshCw, FiExternalLink, 
  FiCheck, FiCopy, FiEye, FiSave, FiAlertCircle,
  FiLink, FiImage, FiGrid, FiStar, FiCheckCircle
} from 'react-icons/fi';

async function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.88) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
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
            resolve(file);
          }
        }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

function FormatBytes(bytes) {
  if (!bytes || bytes === 0) return 'Auto Size';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Ultra-User-Friendly Image Section Card Component
 */
function ImageSectionCard({ 
  icon,
  title, 
  subtitle,
  imageObj, 
  defaultDemoAsset,
  onSaveImage, 
  onRemoveImage 
}) {
  const { uploadCaseStudyFile, deleteCaseStudyImage } = useAdmin();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof imageObj === 'string' ? imageObj : imageObj?.url || '';
  const currentPublicId = typeof imageObj === 'object' ? imageObj?.public_id || '' : '';
  const currentAlt = typeof imageObj === 'object' ? imageObj?.alt || title : title;
  const currentFilename = typeof imageObj === 'object' ? imageObj?.filename || '' : '';
  const currentSize = typeof imageObj === 'object' ? imageObj?.size || 0 : 0;
  const currentDimensions = typeof imageObj === 'object' && imageObj?.width ? `${imageObj.width} x ${imageObj.height} px` : 'Auto Responsive';

  const [altText, setAltText] = useState(currentAlt);
  const [customUrl, setCustomUrl] = useState(currentUrl);

  useEffect(() => {
    setAltText(currentAlt);
    setCustomUrl(currentUrl);
  }, [currentAlt, currentUrl]);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    setErrorMessage('');

    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext) && !file.type.startsWith('image/')) {
      setErrorMessage('Unsupported format. Please select JPG, PNG, WEBP, AVIF, or SVG.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit.');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const optimizedFile = await compressImage(file);
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

        onSaveImage(newImageObj);
        showSuccess(`${title} uploaded successfully!`);
      } else {
        setErrorMessage(res.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      setErrorMessage(err.message || 'Upload failed. Network error.');
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
    if (!window.confirm(`Are you sure you want to remove the image for ${title}?`)) return;
    if (currentPublicId || currentUrl) {
      deleteCaseStudyImage(currentPublicId || currentUrl);
    }
    onRemoveImage();
    showSuccess(`${title} image removed.`);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    onSaveImage({ url: customUrl.trim(), alt: altText || title });
    setShowUrlInput(false);
    showSuccess(`${title} image URL updated.`);
  };

  const handleLoadDemo = () => {
    if (!defaultDemoAsset) return;
    onSaveImage({ url: defaultDemoAsset, alt: title });
    showSuccess(`Restored default demo image for ${title}.`);
  };

  const handleCopyUrl = () => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCloudinary = currentUrl.includes('res.cloudinary.com');
  const isDefaultAsset = currentUrl.startsWith('/assets/');
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
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '20px', background: '#F3F4F6', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon || '🖼️'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#6B7280' }}>{subtitle}</p>}
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isCloudinary ? (
            <span style={{ fontSize: '11.5px', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: '999px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <FiCheckCircle /> Cloudinary Image
            </span>
          ) : isDefaultAsset ? (
            <span style={{ fontSize: '11.5px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '4px 12px', borderRadius: '999px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <FiStar /> Demo Mockup
            </span>
          ) : currentUrl ? (
            <span style={{ fontSize: '11.5px', background: '#F3F4F6', color: '#374151', padding: '4px 12px', borderRadius: '999px', fontWeight: '700' }}>
              Custom URL
            </span>
          ) : (
            <span style={{ fontSize: '11.5px', background: '#FEF2F2', color: '#B91C1C', padding: '4px 12px', borderRadius: '999px', fontWeight: '700' }}>
              No Image
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
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

      {/* Card Content: Preview or Drag-Drop */}
      {currentUrl ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
          {/* Left Column: Image Preview */}
          <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#0a0a0f', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={currentUrl} 
              alt={currentAlt} 
              style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
            />
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
              <button 
                type="button" 
                onClick={handleCopyUrl} 
                style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied ? <FiCheck /> : <FiCopy />} {copied ? 'Copied' : 'Copy Link'}
              </button>
              <a 
                href={currentUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FiEye /> View Full
              </a>
            </div>
          </div>

          {/* Right Column: Actions & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: '12px', border: '1px solid #F3F4F6', fontSize: '12px', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>Asset Name:</strong> {currentFilename || title}</div>
              <div><strong>Resolution:</strong> {currentDimensions}</div>
              <div><strong>Size:</strong> {FormatBytes(currentSize)}</div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <label htmlFor={inputId} style={{ flex: 1, background: '#4F46E5', color: '#ffffff', padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FiRefreshCw /> Upload New File
                <input type="file" accept="image/*" id={inputId} onChange={e => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
              </label>

              <button 
                type="button" 
                onClick={() => setShowUrlInput(!showUrlInput)}
                style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiLink /> {showUrlInput ? 'Hide Paste URL' : 'Paste Link'}
              </button>

              <button 
                type="button" 
                onClick={handleDelete} 
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiTrash2 /> Remove
              </button>
            </div>

            {/* Paste Link Box */}
            {showUrlInput && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="text" 
                  value={customUrl} 
                  onChange={e => setCustomUrl(e.target.value)} 
                  placeholder="Paste direct image URL (https://...)" 
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #4F46E5', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={handleApplyCustomUrl} 
                  style={{ background: '#4F46E5', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Save Link
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload State */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? '#4F46E5' : '#D1D5DB'}`,
            borderRadius: '16px',
            padding: '28px 20px',
            textAlign: 'center',
            background: isDragging ? '#EEF2FF' : '#F9FAFB',
            transition: 'all 0.2s ease'
          }}
        >
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#4F46E5' }}>
                Uploading to Cloudinary... {progress}%
              </div>
              <div style={{ width: '100%', maxWidth: '280px', height: '8px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#4F46E5', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <FiUploadCloud size={38} color="#4F46E5" />
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                  Drag & drop image file here, or <span style={{ color: '#4F46E5', textDecoration: 'underline', cursor: 'pointer' }}>browse computer</span>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                  JPG, PNG, WEBP, AVIF, SVG (Max 15MB)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <label htmlFor={inputId} style={{ background: '#4F46E5', color: '#ffffff', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-block' }}>
                  Choose File
                  <input type="file" accept="image/*" id={inputId} onChange={e => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
                </label>

                {defaultDemoAsset && (
                  <button 
                    type="button" 
                    onClick={handleLoadDemo} 
                    style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FiStar /> Load Demo Mockup
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Unlimited Gallery Manager
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
      deleteCaseStudyImage(target.public_id || target.url);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827' }}>🖼️ Project Supplementary Gallery</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>Add extra design screens. Drag thumbnails to reorder.</p>
        </div>
        <label style={{ background: '#4F46E5', color: '#ffffff', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-block' }}>
          + Upload Gallery Files
          <input type="file" multiple accept="image/*" onChange={e => handleAddFiles(e.target.files)} style={{ display: 'none' }} />
        </label>
      </div>

      {isUploading && (
        <div style={{ color: '#4F46E5', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
          ⏳ Uploading images to Cloudinary...
        </div>
      )}

      {galleryImages.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', background: '#F9FAFB', borderRadius: '14px', border: '1px dashed #D1D5DB', color: '#6B7280', fontSize: '13px' }}>
          No extra gallery images added yet. Click "+ Upload Gallery Files" to attach additional screen mockups.
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
                borderRadius: '14px',
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: 'grab'
              }}
            >
              <div style={{ position: 'relative', height: '140px', borderRadius: '10px', overflow: 'hidden', background: '#0a0a0f' }}>
                <img src={img.url} alt={img.alt || 'Gallery item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
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
 * Case Study Link Settings Component
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
    { key: 'liveProject', label: '🌐 Live Project URL', placeholder: 'https://project.faheem.design' },
    { key: 'github', label: '💻 GitHub Repo URL', placeholder: 'https://github.com/faheem/repo' },
    { key: 'figma', label: '🎨 Figma File URL', placeholder: 'https://figma.com/file/...' },
    { key: 'behance', label: '🖼️ Behance Showcase URL', placeholder: 'https://behance.net/gallery/...' },
    { key: 'dribbble', label: '🏀 Dribbble Shot URL', placeholder: 'https://dribbble.com/shots/...' },
    { key: 'prototype', label: '⚡ Interactive Prototype URL', placeholder: 'https://proto.io/...' },
    { key: 'video', label: '🎥 Demo Video URL (YouTube/Vimeo)', placeholder: 'https://youtube.com/watch?v=...' }
  ];

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #EAEAEA', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '800', color: '#111827' }}>🔗 Project Showcase Links</h3>
      <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6B7280' }}>Manage live demo links, Figma files, and portfolio showcase links</p>

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
                style={{ flex: 1, padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
              />
              {linksState[key] && (
                <a 
                  href={linksState[key]} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ background: '#F3F4F6', color: '#4F46E5', padding: '9px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Test & Open Link"
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
 * Main Ultra-User-Friendly Case Study CMS Manager
 */
export default function CaseStudyCMSManager({ project, onSaveComplete }) {
  const { updateCaseStudy } = useAdmin();
  const [activeTab, setActiveTab] = useState('images'); // 'images' | 'links' | 'gallery'
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
      setToastMessage('Case Study images & links saved live!');
      setTimeout(() => setToastMessage(''), 3500);
      if (onSaveComplete) onSaveComplete(res.project);
    } else {
      alert(res.message || 'Failed to save changes.');
    }
  };

  if (!project) return null;

  const projectSlug = project.slug || project._id;

  return (
    <div style={{ marginTop: '28px' }}>
      {/* CMS Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚡ Case Study CMS Manager
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#6B7280' }}>
            Simple 1-click management for <strong>{project.name}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href={`/projects/${projectSlug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#F3F4F6',
              color: '#374151',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #D1D5DB'
            }}
          >
            <FiEye /> View Live Page
          </a>

          <button 
            type="button" 
            onClick={handleGlobalSave} 
            disabled={isSaving}
            style={{
              background: '#10B981',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <FiSave size={16} />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiCheckCircle size={18} /> {toastMessage}
        </div>
      )}

      {/* Sub-Tab Selector Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #EAEAEA', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'images' ? '#4F46E5' : '#F3F4F6',
            color: activeTab === 'images' ? '#ffffff' : '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FiImage /> Section Mockup Images
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('links')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'links' ? '#4F46E5' : '#F3F4F6',
            color: activeTab === 'links' ? '#ffffff' : '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FiLink /> Project & Social Links
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'gallery' ? '#4F46E5' : '#F3F4F6',
            color: activeTab === 'gallery' ? '#ffffff' : '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FiGrid /> Supplementary Gallery ({galleryImages.length})
        </button>
      </div>

      {/* TAB 1: SECTION MOCKUP IMAGES */}
      {activeTab === 'images' && (
        <div>
          <ImageSectionCard 
            icon="🌄"
            title="Hero Banner Image" 
            subtitle="Main top wide banner displayed at the head of the case study"
            imageObj={heroImage}
            defaultDemoAsset="/assets/project_eco_shades.jpg"
            onSaveImage={setHeroImage}
            onRemoveImage={() => setHeroImage('')}
          />

          <ImageSectionCard 
            icon="🎯"
            title="The Challenge Image" 
            subtitle="Mockup image displayed alongside the project challenge section"
            imageObj={challengeImage}
            defaultDemoAsset="/assets/mockup_challenge.png"
            onSaveImage={setChallengeImage}
            onRemoveImage={() => setChallengeImage('')}
          />

          <ImageSectionCard 
            icon="💡"
            title="The Solution Image" 
            subtitle="Mockup image displayed alongside the project solution section"
            imageObj={solutionImage}
            defaultDemoAsset="/assets/mockup_solution.png"
            onSaveImage={setSolutionImage}
            onRemoveImage={() => setSolutionImage('')}
          />

          <ImageSectionCard 
            icon="🏆"
            title="The Result Image" 
            subtitle="Mockup image displayed alongside the project results section"
            imageObj={resultImage}
            defaultDemoAsset="/assets/mockup_result.png"
            onSaveImage={setResultImage}
            onRemoveImage={() => setResultImage('')}
          />

          <ImageSectionCard 
            icon="🏁"
            title="Conclusion Image" 
            subtitle="Final mockup image displayed alongside the conclusion section"
            imageObj={conclusionImage}
            defaultDemoAsset="/assets/mockup_conclusion.png"
            onSaveImage={setConclusionImage}
            onRemoveImage={() => setConclusionImage('')}
          />
        </div>
      )}

      {/* TAB 2: PROJECT LINKS */}
      {activeTab === 'links' && (
        <LinksSettingsCard 
          links={links}
          onSaveLinks={setLinks}
        />
      )}

      {/* TAB 3: SUPPLEMENTARY GALLERY */}
      {activeTab === 'gallery' && (
        <UnlimitedGalleryCard 
          galleryImages={galleryImages}
          onUpdateGallery={setGalleryImages}
        />
      )}

      {/* Bottom Sticky Action Bar */}
      <div style={{
        position: 'sticky',
        bottom: '20px',
        background: '#ffffff',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid #EAEAEA',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        zIndex: 100
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
          ✨ All changes sync instantly across Cloudinary & MongoDB
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <a 
            href={`/projects/${projectSlug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#F3F4F6',
              color: '#374151',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiEye /> View Live Page
          </a>

          <button 
            type="button" 
            onClick={handleGlobalSave} 
            disabled={isSaving}
            style={{
              background: '#10B981',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <FiSave size={16} />
            {isSaving ? 'Saving Changes...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
