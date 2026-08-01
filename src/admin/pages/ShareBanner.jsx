import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { API_BASE } from '../../config/api';
import { 
  FiUploadCloud, FiTrash2, FiCopy, FiCheck, FiImage, 
  FiAlertCircle, FiCheckCircle, FiRefreshCw, FiInfo, FiLayers,
  FiLink, FiFolder
} from 'react-icons/fi';
import '../Admin.css';

export default function ShareBanner() {
  const { token } = useAdmin();
  
  // Banner data state
  const [banner, setBanner] = useState({ imageUrl: '', publicId: '', updatedAt: null });
  const [isFetching, setIsFetching] = useState(true);
  
  // Upload mode tab state ('file' | 'url')
  const [uploadMode, setUploadMode] = useState('file');

  // File drag & upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // External URL input state
  const [externalUrl, setExternalUrl] = useState('');
  
  // Action loading states ('uploading' | 'saving' | 'deleting' | null)
  const [activeAction, setActiveAction] = useState(null);
  
  // Toast state
  const [toast, setToast] = useState({ type: null, message: '' });
  
  // Copy button state
  const [isCopied, setIsCopied] = useState(false);
  
  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const fileInputRef = useRef(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ type: null, message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch initial share banner state on mount
  useEffect(() => {
    fetchShareBanner();
  }, []);

  const fetchShareBanner = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_BASE}/settings/share-banner?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.banner) {
          setBanner(data.banner);
        }
      }
    } catch (err) {
      console.error('Failed to fetch share banner:', err);
    } finally {
      setIsFetching(false);
    }
  };

  // Helper to append cache-busting timestamp
  const getVersionedUrl = (url, updatedAt) => {
    if (!url) return '';
    const ts = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return url.includes('?') ? `${url}&v=${ts}` : `${url}?v=${ts}`;
  };

  // File validation
  const validateFile = (file) => {
    if (!file) return false;
    
    // Validate MIME type & Extension
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const ext = file.name.split('.').pop().toLowerCase();
    const isExtValid = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

    if (!allowedTypes.includes(file.type) && !isExtValid) {
      setToast({
        type: 'error',
        message: 'Invalid file format. Please select a JPG, PNG, or WEBP image.'
      });
      return false;
    }

    // Validate 5 MB size limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setToast({
        type: 'error',
        message: 'File size exceeds maximum allowed limit of 5 MB.'
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setToast({ type: null, message: '' });
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload Banner via File (XHR with progress)
  const handleUploadBannerFile = () => {
    if (!selectedFile) {
      setToast({ type: 'error', message: 'Please select an image file to upload.' });
      return;
    }

    setActiveAction('uploading');
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('banner', selectedFile);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      setActiveAction(null);
      setUploadProgress(0);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.banner) {
            setBanner(res.banner);
            setSelectedFile(null);
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl('');
            }
            setToast({ type: 'success', message: 'Share banner updated successfully!' });
          } else {
            setToast({ type: 'error', message: res.error || 'Failed to update share banner.' });
          }
        } catch {
          setToast({ type: 'error', message: 'Server returned an invalid response.' });
        }
      } else {
        let errMsg = 'Failed to upload share banner.';
        try {
          const err = JSON.parse(xhr.responseText);
          errMsg = err.error || err.message || errMsg;
        } catch {}
        setToast({ type: 'error', message: errMsg });
      }
    });

    xhr.addEventListener('error', () => {
      setActiveAction(null);
      setUploadProgress(0);
      setToast({ type: 'error', message: 'Network error occurred during upload.' });
    });

    xhr.open('PUT', `${API_BASE}/settings/share-banner`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  };

  // Upload Banner via Image URL
  const handleUploadBannerUrl = async () => {
    if (!externalUrl || !externalUrl.trim()) {
      setToast({ type: 'error', message: 'Please enter a valid image URL.' });
      return;
    }

    const trimmedUrl = externalUrl.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setToast({ type: 'error', message: 'Invalid URL format. Must start with http:// or https://' });
      return;
    }

    setActiveAction('saving');
    try {
      const res = await fetch(`${API_BASE}/settings/share-banner`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: trimmedUrl })
      });

      const data = await res.json();
      if (res.ok && data.success && data.banner) {
        setBanner(data.banner);
        setExternalUrl('');
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl('');
        }
        setToast({ type: 'success', message: 'Share banner updated from URL successfully!' });
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to upload banner from URL.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error uploading banner from URL.' });
    } finally {
      setActiveAction(null);
    }
  };

  // Delete Share Banner
  const handleConfirmDelete = async () => {
    setShowConfirmModal(false);
    setActiveAction('deleting');
    try {
      const res = await fetch(`${API_BASE}/settings/share-banner`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanner({ imageUrl: '', publicId: '', updatedAt: null });
        setSelectedFile(null);
        setExternalUrl('');
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl('');
        }
        setToast({ type: 'success', message: 'Share banner removed successfully!' });
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to remove share banner.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Network error deleting banner.' });
    } finally {
      setActiveAction(null);
    }
  };

  // Copy Cloudinary URL to clipboard
  const handleCopyUrl = () => {
    if (!banner.imageUrl) return;
    const versionedUrl = getVersionedUrl(banner.imageUrl, banner.updatedAt);
    navigator.clipboard.writeText(versionedUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      setToast({ type: 'error', message: 'Failed to copy URL to clipboard.' });
    });
  };

  const currentDisplayUrl = previewUrl || (uploadMode === 'url' && externalUrl.startsWith('http') ? externalUrl : '') || (banner.imageUrl ? getVersionedUrl(banner.imageUrl, banner.updatedAt) : '');

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header Section */}
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Settings → Share Banner</h1>
          <p className="admin-header-subtitle">
            Manage the social preview banner (Open Graph Image) displayed when your portfolio is shared on WhatsApp, Facebook, LinkedIn, Twitter/X, Telegram, Discord, and Slack.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.message && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          fontWeight: '500',
          background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          color: toast.type === 'success' ? '#10b981' : '#ef4444',
          border: '1px solid',
          borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
          animation: 'fadeIn 300ms ease'
        }}>
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
        
        {/* Main Banner Settings Panel */}
        <div className="admin-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="admin-panel-title" style={{ margin: 0 }}>Social Sharing Banner</h3>
            {banner.updatedAt && (
              <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiRefreshCw size={13} />
                Last updated: {new Date(banner.updatedAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* Banner Specifications Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
            background: 'var(--admin-input-bg)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--admin-border)'
          }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block' }}>Recommended Size</span>
              <strong style={{ fontSize: '14px', color: 'var(--admin-text-main)' }}>1200 × 630 px</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block' }}>Accepted Formats</span>
              <strong style={{ fontSize: '14px', color: 'var(--admin-text-main)' }}>JPG, PNG, WEBP</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block' }}>Maximum File Size</span>
              <strong style={{ fontSize: '14px', color: 'var(--admin-text-main)' }}>5 MB</strong>
            </div>
          </div>

          {/* Current Banner Preview Card */}
          <div style={{ marginBottom: '24px' }}>
            <label className="admin-label" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiImage /> Current Banner Preview
            </label>

            {isFetching ? (
              /* Skeleton Loader */
              <div style={{
                width: '100%',
                aspectRatio: '1200 / 630',
                maxHeight: '340px',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, var(--admin-input-bg) 25%, var(--admin-border) 50%, var(--admin-input-bg) 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeletonPulse 1.5s infinite ease-in-out'
              }} />
            ) : currentDisplayUrl ? (
              <div style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--admin-border)',
                background: '#0a0a0f'
              }}>
                <img 
                  src={currentDisplayUrl} 
                  alt="Share Banner Social Preview"
                  loading="lazy"
                  onError={() => {
                    if (previewUrl) setToast({ type: 'error', message: 'Failed to load preview image from provided source.' });
                  }}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '380px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
                {(previewUrl || (uploadMode === 'url' && externalUrl)) && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(124, 58, 237, 0.9)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Unsaved Preview
                  </div>
                )}
              </div>
            ) : (
              /* Empty Banner Fallback Placeholder */
              <div style={{
                width: '100%',
                padding: '48px 24px',
                borderRadius: '12px',
                border: '2px dashed var(--admin-border)',
                background: 'var(--admin-input-bg)',
                textAlign: 'center',
                color: 'var(--admin-text-muted)'
              }}>
                <FiLayers size={36} style={{ marginBottom: '12px', opacity: 0.6 }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No Share Banner Uploaded</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>
                  Upload a file or enter an image URL below to set your portfolio's social media preview banner.
                </p>
              </div>
            )}
          </div>

          {/* Cloudinary URL (Read Only) & Copy Button */}
          {banner.imageUrl && (
            <div className="admin-form-group" style={{ marginBottom: '24px' }}>
              <label className="admin-label">Cloudinary URL (Read Only)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="admin-input"
                  readOnly 
                  value={getVersionedUrl(banner.imageUrl, banner.updatedAt)}
                  style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1 }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={handleCopyUrl}
                  style={{ minWidth: '110px' }}
                >
                  {isCopied ? <><FiCheck color="#10b981" /> Copied!</> : <><FiCopy /> Copy URL</>}
                </button>
              </div>
            </div>
          )}

          {/* Upload Method Tab Switcher */}
          <div style={{ marginBottom: '20px' }}>
            <label className="admin-label">Select Upload Method</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`admin-btn ${uploadMode === 'file' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setUploadMode('file')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <FiFolder /> Upload File from Device
              </button>
              <button
                type="button"
                className={`admin-btn ${uploadMode === 'url' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setUploadMode('url')}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <FiLink /> Upload via Image URL
              </button>
            </div>
          </div>

          {/* Tab 1: Local File Drag-and-Drop Dropzone */}
          {uploadMode === 'file' && (
            <div className="admin-form-group" style={{ marginBottom: '24px' }}>
              <label className="admin-label">
                {banner.imageUrl ? 'Replace Banner via File' : 'Upload Banner File'}
              </label>
              
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                  borderRadius: '12px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: activeAction ? 'not-allowed' : 'pointer',
                  background: dragActive ? 'var(--admin-primary-glow)' : 'var(--admin-input-bg)',
                  transition: 'all 200ms ease'
                }}
              >
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleInputChange}
                  style={{ display: 'none' }}
                  disabled={!!activeAction}
                />

                <FiUploadCloud size={38} style={{ color: 'var(--admin-primary)', marginBottom: '10px' }} />
                <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '600', color: 'var(--admin-text-main)' }}>
                  {selectedFile ? selectedFile.name : 'Click to select or drag & drop image file here'}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                  Supports JPG, PNG, or WEBP (Max 5 MB)
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: External Image URL Input */}
          {uploadMode === 'url' && (
            <div className="admin-form-group" style={{ marginBottom: '24px' }}>
              <label className="admin-label">Image URL (HTTP / HTTPS)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="url"
                  className="admin-input"
                  placeholder="https://example.com/banner.jpg or https://res.cloudinary.com/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  disabled={!!activeAction}
                  style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1 }}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block', marginTop: '6px' }}>
                Paste any direct image URL. Cloudinary will automatically fetch, optimize, and store the banner in portfolio/share-banner.
              </span>
            </div>
          )}

          {/* Upload Progress Bar (File Upload Mode) */}
          {uploadMode === 'file' && activeAction === 'uploading' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--admin-text-main)' }}>
                <span>Uploading banner to Cloudinary...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{
                height: '8px',
                width: '100%',
                borderRadius: '4px',
                background: 'var(--admin-border)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'var(--admin-primary)',
                  transition: 'width 200ms ease'
                }} />
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--admin-border)' }}>
            {uploadMode === 'file' ? (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={!selectedFile || !!activeAction}
                onClick={handleUploadBannerFile}
              >
                <FiUploadCloud /> 
                {activeAction === 'uploading' 
                  ? 'Uploading...' 
                  : activeAction === 'saving' 
                    ? 'Saving...' 
                    : banner.imageUrl ? 'Save & Replace Banner' : 'Upload Banner'}
              </button>
            ) : (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={!externalUrl || !externalUrl.trim() || !!activeAction}
                onClick={handleUploadBannerUrl}
              >
                <FiLink /> 
                {activeAction === 'saving' ? 'Processing & Saving URL...' : 'Save Banner from URL'}
              </button>
            )}

            {banner.imageUrl && (
              <button
                type="button"
                className="admin-btn"
                disabled={!!activeAction}
                onClick={() => setShowConfirmModal(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <FiTrash2 /> {activeAction === 'deleting' ? 'Deleting...' : 'Remove Banner'}
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Confirmation Modal for Permanent Banner Removal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--admin-sidebar-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--admin-shadow)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: 'var(--admin-text-main)' }}>
              Remove Share Banner?
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--admin-text-muted)', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete the current social preview banner from Cloudinary? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={handleConfirmDelete}
                style={{
                  background: '#ef4444',
                  color: '#ffffff'
                }}
              >
                Permanently Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skeleton Pulse Keyframes CSS */}
      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
