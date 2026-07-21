import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  FiUpload, FiTrash2, FiCopy, FiCheck, FiSearch, 
  FiRefreshCw, FiDownload, FiExternalLink, FiFileText, FiVideo,
  FiImage, FiHardDrive, FiFolder, FiX, FiAlertTriangle,
  FiSliders, FiArrowUpRight, FiCloud
} from 'react-icons/fi';
import '../Admin.css';

export default function MediaLibrary() {
  const { media, isMediaLoading, fetchMedia, uploadMediaFile, deleteMediaFile, replaceMediaFile } = useAdmin();
  
  // States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replacingId, setReplacingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchMedia();
  }, []);

  // 300ms Debounce for Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper: Format bytes to human readable KB/MB/GB
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Real-time Metric Statistics
  const stats = useMemo(() => {
    let totalFiles = media.length;
    let imagesCount = 0;
    let docsCount = 0;
    let totalBytes = 0;

    media.forEach((item) => {
      const type = (item.fileType || '').toLowerCase();
      const name = (item.fileName || '').toLowerCase();
      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(type) || type.startsWith('image/');
      const isDoc = type === 'pdf' || type.includes('pdf') || name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.txt');

      if (isImg) imagesCount++;
      if (isDoc) docsCount++;
      if (item.fileSize) totalBytes += Number(item.fileSize);
    });

    return {
      totalFiles,
      imagesCount,
      docsCount,
      storageUsed: formatBytes(totalBytes)
    };
  }, [media]);

  // Multiple / Single File Upload Handler with Validation
  const processUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(15);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // File Size Check (Max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        showToast(`"${file.name}" exceeds 50MB size limit.`, 'error');
        errorCount++;
        continue;
      }

      // Duplicate Check
      const isDuplicate = media.some(m => m.fileName.toLowerCase() === file.name.toLowerCase());
      if (isDuplicate) {
        const proceed = window.confirm(`An asset named "${file.name}" already exists. Upload anyway?`);
        if (!proceed) continue;
      }

      setUploadProgress(Math.round(((i + 1) / files.length) * 90));
      const res = await uploadMediaFile(file);

      if (res.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setUploadProgress(100);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 400);

    if (successCount > 0) {
      showToast(`Successfully uploaded ${successCount} asset${successCount > 1 ? 's' : ''}!`);
    } else if (errorCount > 0) {
      showToast('File upload failed. Please try again.', 'error');
    }
  };

  const handleFileInputChange = (e) => {
    processUpload(e.target.files);
  };

  // Drag & Drop Handling
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files);
    }
  };

  // File Replacement Handler
  const handleReplaceUpload = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    setReplacingId(id);
    const res = await replaceMediaFile(id, file);
    setReplacingId(null);

    if (res.success) {
      showToast('Asset replaced successfully in Cloudinary!');
      if (selectedAsset && selectedAsset._id === id) {
        fetchMedia();
      }
    } else {
      showToast('Asset replacement failed.', 'error');
    }
  };

  // Copy Link Handler
  const handleCopyLink = (fileUrl, id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(fileUrl);
    setCopiedId(id);
    showToast('Secure link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Confirm Delete Asset
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    const res = await deleteMediaFile(id);
    
    if (res.success) {
      showToast('Asset deleted permanently from Cloudinary & Database.');
      if (selectedAsset && selectedAsset._id === id) {
        setSelectedAsset(null);
      }
    } else {
      showToast('Failed to delete asset.', 'error');
    }
    setDeleteTarget(null);
  };

  // Filtered & Sorted Media Array
  const filteredAndSortedMedia = useMemo(() => {
    let result = [...media];

    // Search Filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(m => 
        (m.fileName && m.fileName.toLowerCase().includes(q)) ||
        (m.fileType && m.fileType.toLowerCase().includes(q)) ||
        (m.publicId && m.publicId.toLowerCase().includes(q))
      );
    }

    // Category Filter Tabs
    if (activeFilter !== 'all') {
      result = result.filter(m => {
        const type = (m.fileType || '').toLowerCase();
        const name = (m.fileName || '').toLowerCase();
        const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(type) || type.startsWith('image/');
        const isSvg = type === 'svg' || name.endsWith('.svg');
        const isVid = ['mp4', 'webm', 'ogg', 'mov'].includes(type) || type.startsWith('video/');
        const isPdf = type === 'pdf' || name.endsWith('.pdf');
        const isDoc = isPdf || name.endsWith('.doc') || name.endsWith('.txt');

        if (activeFilter === 'image') return isImg && !isSvg;
        if (activeFilter === 'svg') return isSvg;
        if (activeFilter === 'video') return isVid;
        if (activeFilter === 'pdf') return isPdf;
        if (activeFilter === 'document') return isDoc;
        if (activeFilter === 'recent') {
          const created = new Date(m.createdAt || Date.now());
          const daysOld = (Date.now() - created.getTime()) / (1000 * 3600 * 24);
          return daysOld <= 7;
        }
        return true;
      });
    }

    // Sorting Modes
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'az') return (a.fileName || '').localeCompare(b.fileName || '');
      if (sortBy === 'za') return (b.fileName || '').localeCompare(a.fileName || '');
      if (sortBy === 'largest') return (b.fileSize || 0) - (a.fileSize || 0);
      if (sortBy === 'smallest') return (a.fileSize || 0) - (b.fileSize || 0);
      return 0;
    });

    return result;
  }, [media, debouncedSearch, activeFilter, sortBy]);

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: toast.type === 'error' ? 'rgba(225, 29, 72, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toast.type === 'error' ? <FiAlertTriangle /> : <FiCheck />}
          {toast.message}
        </div>
      )}

      {/* TOP HEADER */}
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Cloudinary Media Library</h1>
          <p className="admin-header-subtitle">
            Upload, organize, preview and manage all portfolio assets securely in the cloud.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="admin-btn admin-btn-secondary" 
            onClick={() => { fetchMedia(); showToast('Media assets refreshed!'); }}
            title="Refresh assets"
          >
            <FiRefreshCw className={isMediaLoading ? 'spinner' : ''} /> Refresh
          </button>

          <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer' }}>
            <FiUpload /> {uploading ? `Uploading (${uploadProgress}%)` : 'Upload Files'}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileInputChange} 
              style={{ display: 'none' }} 
              multiple
              disabled={uploading} 
            />
          </label>
        </div>
      </div>

      {/* STATS METRIC CARDS (4 CARDS) */}
      <div className="dam-stats-grid">
        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <FiFolder />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">Total Files</span>
            <span className="dam-stat-value">{stats.totalFiles}</span>
          </div>
        </div>

        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <FiImage />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">Images</span>
            <span className="dam-stat-value">{stats.imagesCount}</span>
          </div>
        </div>

        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
            <FiFileText />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">Documents</span>
            <span className="dam-stat-value">{stats.docsCount}</span>
          </div>
        </div>

        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <FiHardDrive />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">Storage Used</span>
            <span className="dam-stat-value">{stats.storageUsed}</span>
          </div>
        </div>
      </div>

      {/* UPLOAD PROGRESS BAR IF ACTIVE */}
      {uploading && (
        <div style={{ marginBottom: '24px', background: 'var(--admin-card-bg)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--admin-text-main)' }}>
            <span>Uploading Assets to Cloudinary...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--admin-primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* DRAG & DROP ZONE OVERLAY */}
      <div 
        className={`dam-dropzone ${isDragActive ? 'active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <FiCloud size={32} style={{ color: 'var(--admin-primary)', marginBottom: '8px' }} />
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--admin-text-main)', marginBottom: '4px' }}>
          {isDragActive ? 'Drop files here to upload instantly' : 'Drag & Drop files here, or click to browse'}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
          Supports Images (PNG, JPG, WEBP, SVG), Videos, and PDFs up to 50MB each
        </p>
      </div>

      <div className="admin-panel">
        {/* SEARCH & FILTER BAR */}
        <div className="dam-filter-bar">
          {/* Category Tabs */}
          <div className="dam-tabs-wrap">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'image', label: 'Images' },
              { id: 'video', label: 'Videos' },
              { id: 'pdf', label: 'PDF' },
              { id: 'svg', label: 'SVG' },
              { id: 'document', label: 'Documents' },
              { id: 'recent', label: 'Recently Uploaded' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`dam-filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="Search media..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
              />
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiSliders style={{ color: 'var(--admin-text-muted)' }} />
              <select 
                className="admin-select" 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ height: '38px', fontSize: '13px', paddingRight: '28px' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A – Z</option>
                <option value="za">Z – A</option>
                <option value="largest">Largest Size</option>
                <option value="smallest">Smallest Size</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOADING SKELETONS */}
        {isMediaLoading ? (
          <div className="dam-media-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <div key={n} className="dam-skeleton-card shimmer-placeholder" />
            ))}
          </div>
        ) : filteredAndSortedMedia.length === 0 ? (
          /* EMPTY STATE */
          <div style={{ color: 'var(--admin-text-muted)', padding: '72px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '16px' }}>
              <FiFolder />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text-main)', marginBottom: '8px' }}>No media assets found</h3>
            <p style={{ fontSize: '14px', maxWidth: '360px', marginBottom: '24px', lineHeight: '1.5' }}>
              {searchTerm || activeFilter !== 'all' 
                ? 'Try tweaking your search term or category filters.' 
                : 'Upload your first image, document, or video asset to get started.'}
            </p>
            <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer' }}>
              <FiUpload /> Upload First Asset
              <input type="file" onChange={handleFileInputChange} style={{ display: 'none' }} multiple />
            </label>
          </div>
        ) : (
          /* MEDIA CARDS GRID */
          <div className="dam-media-grid">
            {filteredAndSortedMedia.map((asset) => {
              const type = (asset.fileType || '').toLowerCase();
              const name = (asset.fileName || '').toLowerCase();
              const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(type) || type.startsWith('image/');
              const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(type) || type.startsWith('video/');
              const isPdf = type === 'pdf' || type.includes('pdf') || name.endsWith('.pdf');

              return (
                <div 
                  key={asset._id} 
                  className="admin-media-card"
                  onClick={() => setSelectedAsset(asset)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* PREVIEW AREA */}
                  <div className="admin-media-preview">
                    {isImage ? (
                      <img src={asset.fileUrl} alt={asset.fileName} loading="lazy" />
                    ) : isVideo ? (
                      <div className="video-gradient-bg">
                        <FiVideo size={32} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px' }}>VIDEO ASSET</span>
                      </div>
                    ) : isPdf ? (
                      <div className="pdf-gradient-bg">
                        <FiFileText size={32} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px' }}>PDF DOCUMENT</span>
                      </div>
                    ) : (
                      <div className="file-gradient-bg">
                        <FiFileText size={32} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px' }}>FILE ATTACHMENT</span>
                      </div>
                    )}

                    {/* REPLACING OVERLAY */}
                    {replacingId === asset._id ? (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '600',
                        zIndex: 2
                      }}>
                        <FiRefreshCw className="spinner" style={{ marginRight: '8px' }} /> Replacing...
                      </div>
                    ) : (
                      /* HOVER ACTIONS OVERLAY */
                      <div className="admin-media-overlay" onClick={e => e.stopPropagation()}>
                        {/* Copy Link */}
                        <button 
                          onClick={(e) => handleCopyLink(asset.fileUrl, asset._id, e)}
                          className="media-action-btn"
                          title="Copy secure link"
                        >
                          {copiedId === asset._id ? <FiCheck size={16} /> : <FiCopy size={16} />}
                        </button>

                        {/* Replace File */}
                        <label 
                          className="media-action-btn"
                          title="Replace file in Cloudinary"
                          style={{ cursor: 'pointer' }}
                        >
                          <FiRefreshCw size={16} />
                          <input 
                            type="file" 
                            onChange={(e) => handleReplaceUpload(e, asset._id)} 
                            style={{ display: 'none' }} 
                            disabled={replacingId !== null}
                          />
                        </label>

                        {/* Download / Open Link */}
                        <a 
                          href={asset.fileUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          download={asset.fileName} 
                          className="media-action-btn"
                          title={isPdf ? "Download PDF" : "Open link"}
                        >
                          {isPdf ? <FiDownload size={16} /> : <FiExternalLink size={16} />}
                        </a>

                        {/* Delete Asset */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(asset); }}
                          className="media-action-btn btn-delete"
                          title="Delete permanently"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* INFO SECTION */}
                  <div className="admin-media-info">
                    <span className="admin-media-name" title={asset.fileName}>
                      {asset.fileName}
                    </span>

                    <div className="admin-media-meta-row">
                      <span className="admin-media-size">
                        {formatBytes(asset.fileSize)}
                      </span>

                      <span className={`media-type-badge ${
                        isImage ? 'media-badge-image' : 
                        isPdf ? 'media-badge-pdf' : 
                        isVideo ? 'media-badge-video' : 
                        'media-badge-file'
                      }`}>
                        {isImage ? 'Image' : isPdf ? 'PDF' : isVideo ? 'Video' : 'File'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SIDE DETAIL INSPECTOR PANEL */}
      {selectedAsset && (
        <>
          <div className="dam-inspector-overlay" onClick={() => setSelectedAsset(null)} />
          <div className="dam-inspector-panel">
            <div className="dam-inspector-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--admin-text-main)' }}>Asset Details</h3>
              <button 
                onClick={() => setSelectedAsset(null)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Asset Large Preview */}
            <div className="dam-inspector-preview">
              {['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes((selectedAsset.fileType || '').toLowerCase()) || selectedAsset.fileType?.startsWith('image/') ? (
                <img src={selectedAsset.fileUrl} alt={selectedAsset.fileName} />
              ) : selectedAsset.fileType === 'pdf' || selectedAsset.fileName?.endsWith('.pdf') ? (
                <div className="pdf-gradient-bg">
                  <FiFileText size={48} style={{ marginBottom: '8px' }} />
                  <span>PDF Document</span>
                </div>
              ) : (
                <div className="file-gradient-bg">
                  <FiFileText size={48} style={{ marginBottom: '8px' }} />
                  <span>File Asset</span>
                </div>
              )}
            </div>

            {/* Metadata Listing */}
            <div className="dam-meta-list">
              <div className="dam-meta-item">
                <span className="dam-meta-key">File Name:</span>
                <span className="dam-meta-val">{selectedAsset.fileName}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">File Type:</span>
                <span className="dam-meta-val">{selectedAsset.fileType || 'N/A'}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">File Size:</span>
                <span className="dam-meta-val">{formatBytes(selectedAsset.fileSize)}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">Public ID:</span>
                <span className="dam-meta-val">{selectedAsset.publicId || 'Local Storage'}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">Created Date:</span>
                <span className="dam-meta-val">
                  {selectedAsset.createdAt ? new Date(selectedAsset.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">Secure URL:</span>
                <span className="dam-meta-val" style={{ fontSize: '11px' }}>{selectedAsset.fileUrl}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              <button 
                className="admin-btn admin-btn-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={(e) => handleCopyLink(selectedAsset.fileUrl, selectedAsset._id, e)}
              >
                {copiedId === selectedAsset._id ? <FiCheck /> : <FiCopy />} Copy Secure Link
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a 
                  href={selectedAsset.fileUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="admin-btn admin-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <FiArrowUpRight /> Open Link
                </a>

                <button 
                  className="admin-btn admin-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                  onClick={() => {
                    setDeleteTarget(selectedAsset);
                  }}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="dam-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="dam-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <FiTrash2 />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--admin-text-main)' }}>Confirm Deletion</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Permanent Cloudinary Removal</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--admin-text-main)' }}>"{deleteTarget.fileName}"</strong>? This will remove the asset from Cloudinary and your database.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="admin-btn admin-btn-secondary" 
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button 
                className="admin-btn" 
                style={{ background: '#f43f5e', color: '#ffffff', border: 'none' }}
                onClick={confirmDelete}
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
