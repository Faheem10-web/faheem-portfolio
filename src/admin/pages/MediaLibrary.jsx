import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  FiUpload, FiTrash2, FiCopy, FiCheck, FiSearch, 
  FiRefreshCw, FiDownload, FiExternalLink, FiFileText, FiVideo,
  FiImage, FiHardDrive, FiFolder, FiX, FiAlertTriangle,
  FiSliders, FiArrowUpRight, FiCloud, FiEye, FiCheckSquare,
  FiSquare, FiTag, FiMaximize2, FiMinimize2, FiLock, FiCheckCircle
} from 'react-icons/fi';
import '../Admin.css';

export default function MediaLibrary() {
  const { 
    media, 
    isMediaLoading, 
    fetchMedia, 
    syncAllMedia, 
    uploadMediaFile, 
    deleteMediaFile, 
    replaceMediaFile,
    bulkDeleteMedia 
  } = useAdmin();
  
  // State variables
  const [activeFolder, setActiveFolder] = useState('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Selection & Inspector
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Upload & Replace
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [targetUploadFolder, setTargetUploadFolder] = useState('General');
  const [replacingId, setReplacingId] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Modals & Previews
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [lightboxAsset, setLightboxAsset] = useState(null);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [toast, setToast] = useState(null);
  
  const fileInputRef = useRef(null);

  // Initial Sync & Auto-Index
  useEffect(() => {
    syncAllMedia();
  }, []);

  // Debounced Search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Human Readable Bytes Format
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Real-time Storage & Category Metrics
  const stats = useMemo(() => {
    let totalFiles = media.length;
    let imagesCount = 0;
    let videosCount = 0;
    let docsCount = 0;
    let inUseCount = 0;
    let totalBytes = 0;

    media.forEach((item) => {
      const type = (item.fileType || '').toLowerCase();
      const name = (item.fileName || '').toLowerCase();
      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes(type) || type.startsWith('image/');
      const isVid = ['mp4', 'webm', 'ogg', 'mov'].includes(type) || type.startsWith('video/');
      const isDoc = type === 'pdf' || name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.txt');

      if (isImg) imagesCount++;
      if (isVid) videosCount++;
      if (isDoc) docsCount++;
      if (item.usedIn && item.usedIn.length > 0) inUseCount++;
      if (item.fileSize) totalBytes += Number(item.fileSize);
    });

    return {
      totalFiles,
      imagesCount,
      videosCount,
      docsCount,
      inUseCount,
      unusedCount: totalFiles - inUseCount,
      storageUsed: formatBytes(totalBytes)
    };
  }, [media]);

  // Upload Processor
  const processUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(15);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        showToast(`"${file.name}" exceeds 50MB size limit.`, 'error');
        errorCount++;
        continue;
      }

      setUploadProgress(Math.round(((i + 1) / files.length) * 90));
      const folderToUse = activeFolder !== 'all' ? activeFolder : targetUploadFolder;
      const res = await uploadMediaFile(file, folderToUse);

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
      showToast(`Successfully uploaded ${successCount} asset${successCount > 1 ? 's' : ''} to ${targetUploadFolder}!`);
      syncAllMedia();
    } else if (errorCount > 0) {
      showToast('File upload failed. Please try again.', 'error');
    }
  };

  const handleFileInputChange = (e) => {
    processUpload(e.target.files);
  };

  // Drag & Drop
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

  // Asset Replacement
  const handleReplaceUpload = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    setReplacingId(id);
    const res = await replaceMediaFile(id, file);
    setReplacingId(null);

    if (res.success) {
      showToast('Asset content replaced successfully in Cloudinary!');
      syncAllMedia();
    } else {
      showToast('Asset replacement failed.', 'error');
    }
  };

  // Multi-Select Toggles
  const toggleSelectAsset = (assetId, e) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedMedia.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedMedia.map(m => m._id));
    }
  };

  // Delete Single Asset with Safety Guard
  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    const res = await deleteMediaFile(deleteTarget._id);
    if (res.success) {
      showToast('Asset deleted permanently from Cloudinary & Database.');
      if (selectedAsset && selectedAsset._id === deleteTarget._id) {
        setSelectedAsset(null);
      }
    } else {
      showToast(res.message || 'Failed to delete asset.', 'error');
    }
    setDeleteTarget(null);
  };

  // Bulk Delete Unused Assets
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const res = await bulkDeleteMedia(selectedIds);
    if (res.success) {
      if (res.blockedCount > 0) {
        showToast(`Deleted ${res.deletedCount} unused assets. ${res.blockedCount} assets were kept because they are in active use.`, 'error');
      } else {
        showToast(`Successfully deleted ${res.deletedCount} assets permanently!`);
      }
      setSelectedIds([]);
      if (selectedAsset && selectedIds.includes(selectedAsset._id)) {
        setSelectedAsset(null);
      }
    } else {
      showToast(res.message || 'Bulk delete failed.', 'error');
    }
    setBulkDeleteConfirm(false);
  };

  // Copy Code Snippet Handler
  const handleCopySnippet = (text, formatKey, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatKey);
    showToast(`${formatKey} copied to clipboard!`);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Folders Taxonomy List
  const folders = [
    { id: 'all', label: 'All Folders', icon: '📁' },
    { id: 'Projects', label: 'Projects', icon: '🚀' },
    { id: 'Hero', label: 'Hero Section', icon: '✨' },
    { id: 'About', label: 'About Page', icon: '👤' },
    { id: 'Services', label: 'Services', icon: '💼' },
    { id: 'Resume', label: 'Resume / CV', icon: '📄' },
    { id: 'Brand Assets', label: 'Brand & Logos', icon: '🎨' },
    { id: 'General', label: 'General Assets', icon: '📦' }
  ];

  // Filtering & Sorting Core Engine
  const filteredAndSortedMedia = useMemo(() => {
    let result = [...media];

    // Search Query Filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(m => 
        (m.fileName && m.fileName.toLowerCase().includes(q)) ||
        (m.fileType && m.fileType.toLowerCase().includes(q)) ||
        (m.publicId && m.publicId.toLowerCase().includes(q)) ||
        (m.folder && m.folder.toLowerCase().includes(q)) ||
        (Array.isArray(m.usedIn) && m.usedIn.some(u => u.toLowerCase().includes(q)))
      );
    }

    // Folder Filter (Dual match: folder name OR usedIn section keyword)
    if (activeFolder !== 'all') {
      const fLower = activeFolder.toLowerCase();
      result = result.filter(m => {
        const folderMatch = (m.folder || 'General').toLowerCase() === fLower;
        const usageMatch = Array.isArray(m.usedIn) && m.usedIn.some(u => {
          const uLower = u.toLowerCase();
          if (fLower === 'projects') return uLower.includes('project') || uLower.includes('case study');
          if (fLower === 'hero') return uLower.includes('hero');
          if (fLower === 'about') return uLower.includes('about');
          if (fLower === 'services') return uLower.includes('service');
          if (fLower === 'resume') return uLower.includes('resume');
          if (fLower === 'brand assets') return uLower.includes('seo') || uLower.includes('favicon') || uLower.includes('navbar') || uLower.includes('logo');
          return false;
        });
        return folderMatch || usageMatch;
      });
    }

    // Category Type Filter
    if (activeTypeFilter !== 'all') {
      result = result.filter(m => {
        const type = (m.fileType || '').toLowerCase();
        const name = (m.fileName || '').toLowerCase();
        const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'].includes(type) || type.startsWith('image/');
        const isSvg = type === 'svg' || name.endsWith('.svg');
        const isVid = ['mp4', 'webm', 'ogg', 'mov'].includes(type) || type.startsWith('video/');
        const isPdf = type === 'pdf' || name.endsWith('.pdf');
        const isDoc = isPdf || name.endsWith('.doc') || name.endsWith('.txt');

        if (activeTypeFilter === 'image') return isImg && !isSvg;
        if (activeTypeFilter === 'svg') return isSvg;
        if (activeTypeFilter === 'video') return isVid;
        if (activeTypeFilter === 'pdf') return isPdf;
        if (activeTypeFilter === 'document') return isDoc;
        return true;
      });
    }

    // Usage Status Filter
    if (usageFilter !== 'all') {
      result = result.filter(m => {
        const hasUsage = Array.isArray(m.usedIn) && m.usedIn.length > 0;
        if (usageFilter === 'in_use') return hasUsage;
        if (usageFilter === 'unused') return !hasUsage;
        return true;
      });
    }

    // Sorting Engine
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'az') return (a.fileName || '').localeCompare(b.fileName || '');
      if (sortBy === 'za') return (b.fileName || '').localeCompare(a.fileName || '');
      if (sortBy === 'largest') return (b.fileSize || 0) - (a.fileSize || 0);
      if (sortBy === 'smallest') return (a.fileSize || 0) - (b.fileSize || 0);
      if (sortBy === 'most_used') return ((b.usedIn || []).length) - ((a.usedIn || []).length);
      return 0;
    });

    return result;
  }, [media, debouncedSearch, activeFolder, activeTypeFilter, usageFilter, sortBy]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="admin-header-title">Digital Asset Management (DAM)</h1>
            <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
              Cloudinary Single Source of Truth
            </span>
          </div>
          <p className="admin-header-subtitle">
            Central repository for every portfolio image, project media, resume PDF, icon, and video asset.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="admin-btn admin-btn-secondary" 
            onClick={() => { syncAllMedia(); showToast('Auto-indexed all portfolio assets & usage references!'); }}
            title="Auto-index all assets and sync usage references"
          >
            <FiRefreshCw className={isMediaLoading ? 'spinner' : ''} /> Sync & Auto-Index
          </button>

          <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer' }}>
            <FiUpload /> {uploading ? `Uploading (${uploadProgress}%)` : 'Upload Assets'}
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

      {/* METRICS DASHBOARD (5 METRIC CARDS) */}
      <div className="dam-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <FiFolder />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">Total Indexed Assets</span>
            <span className="dam-stat-value">{stats.totalFiles}</span>
          </div>
        </div>

        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <FiImage />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">Images & SVGs</span>
            <span className="dam-stat-value">{stats.imagesCount}</span>
          </div>
        </div>

        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <FiCheckCircle />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">In Active Use</span>
            <span className="dam-stat-value">{stats.inUseCount}</span>
          </div>
        </div>

        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
            <FiFileText />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">Documents & PDFs</span>
            <span className="dam-stat-value">{stats.docsCount}</span>
          </div>
        </div>

        <div className="dam-stat-card">
          <div className="dam-stat-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
            <FiHardDrive />
          </div>
          <div className="dam-stat-info">
            <span className="dam-stat-label">Cloudinary Usage</span>
            <span className="dam-stat-value">{stats.storageUsed}</span>
          </div>
        </div>
      </div>

      {/* UPLOAD PROGRESS BAR */}
      {uploading && (
        <div style={{ marginBottom: '24px', background: 'var(--admin-card-bg)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--admin-text-main)' }}>
            <span>Uploading to folder "{activeFolder !== 'all' ? activeFolder : targetUploadFolder}"...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--admin-primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* DRAG & DROP ZONE */}
      <div 
        className={`dam-dropzone ${isDragActive ? 'active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        style={{ marginBottom: '24px' }}
      >
        <FiCloud size={32} style={{ color: 'var(--admin-primary)', marginBottom: '8px' }} />
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--admin-text-main)', marginBottom: '4px' }}>
          {isDragActive ? 'Drop files here to upload instantly' : 'Drag & Drop files here, or click to browse'}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
          Assets automatically sync and map to your active portfolio sections
        </p>
      </div>

      {/* FOLDERS TAXONOMY BAR */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {folders.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFolder(f.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeFolder === f.id ? 'var(--admin-primary)' : 'var(--admin-card-bg)',
              color: activeFolder === f.id ? '#ffffff' : 'var(--admin-text-main)',
              border: '1px solid',
              borderColor: activeFolder === f.id ? 'var(--admin-primary)' : 'var(--admin-border)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-panel">
        {/* MULTI-SELECT BAR */}
        {selectedIds.length > 0 && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
                {selectedIds.length} Asset{selectedIds.length > 1 ? 's' : ''} Selected
              </span>
              <button 
                onClick={handleSelectAll} 
                style={{ background: 'none', border: 'none', color: '#8b5cf6', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {selectedIds.length === filteredAndSortedMedia.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="admin-btn admin-btn-secondary"
                style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                onClick={() => setBulkDeleteConfirm(true)}
              >
                <FiTrash2 /> Bulk Delete Unused
              </button>

              <button 
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedIds([])}
              >
                Cancel Selection
              </button>
            </div>
          </div>
        )}

        {/* SEARCH & FILTER CONTROLS BAR */}
        <div className="dam-filter-bar" style={{ marginBottom: '24px' }}>
          {/* Category Type Tabs */}
          <div className="dam-tabs-wrap">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'image', label: 'Images' },
              { id: 'video', label: 'Videos' },
              { id: 'pdf', label: 'PDFs' },
              { id: 'svg', label: 'SVGs' },
              { id: 'document', label: 'Docs' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`dam-filter-tab ${activeTypeFilter === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTypeFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '220px' }}>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="Search DAM assets..." 
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

            {/* Usage Filter */}
            <select 
              className="admin-select"
              value={usageFilter}
              onChange={e => setUsageFilter(e.target.value)}
              style={{ height: '38px', fontSize: '13px', paddingRight: '28px' }}
            >
              <option value="all">All Usage Status</option>
              <option value="in_use">🟢 In Active Use</option>
              <option value="unused">⚪ Unused Assets</option>
            </select>

            {/* Sorting Dropdown */}
            <select 
              className="admin-select" 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ height: '38px', fontSize: '13px', paddingRight: '28px' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_used">Most Used</option>
              <option value="az">Name A – Z</option>
              <option value="za">Name Z – A</option>
              <option value="largest">Largest Size</option>
              <option value="smallest">Smallest Size</option>
            </select>
          </div>
        </div>

        {/* LOADING SKELETONS */}
        {isMediaLoading ? (
          <div className="dam-media-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
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
            <p style={{ fontSize: '14px', maxWidth: '380px', marginBottom: '24px', lineHeight: '1.5' }}>
              {searchTerm || activeFolder !== 'all' || activeTypeFilter !== 'all' || usageFilter !== 'all'
                ? 'Try tweaking your search term, folder, or status filters.' 
                : 'Upload your first image, document, or video asset to index it in your DAM.'}
            </p>
            <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer' }}>
              <FiUpload /> Upload First Asset
              <input type="file" onChange={handleFileInputChange} style={{ display: 'none' }} multiple />
            </label>
          </div>
        ) : (
          /* MEDIA ASSET CARDS GRID */
          <div className="dam-media-grid">
            {filteredAndSortedMedia.map((asset) => {
              const type = (asset.fileType || '').toLowerCase();
              const name = (asset.fileName || '').toLowerCase();
              const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes(type) || type.startsWith('image/');
              const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(type) || type.startsWith('video/');
              const isPdf = type === 'pdf' || type.includes('pdf') || name.endsWith('.pdf');
              const isInUse = Array.isArray(asset.usedIn) && asset.usedIn.length > 0;
              const isSelected = selectedIds.includes(asset._id);

              return (
                <div 
                  key={asset._id} 
                  className={`admin-media-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedAsset(asset)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {/* MULTI-SELECT CHECKBOX */}
                  <div 
                    onClick={(e) => toggleSelectAsset(asset._id, e)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      zIndex: 10,
                      background: isSelected ? 'var(--admin-primary)' : 'rgba(0, 0, 0, 0.5)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {isSelected ? <FiCheck size={14} /> : null}
                  </div>

                  {/* IN-USE / UNUSED BADGE */}
                  {isInUse && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 10,
                      background: 'rgba(16, 185, 129, 0.9)',
                      color: '#ffffff',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }}></span>
                      In Use
                    </div>
                  )}

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
                        {/* Lightbox Preview */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setLightboxAsset(asset); }}
                          className="media-action-btn"
                          title="Open preview"
                        >
                          <FiEye size={16} />
                        </button>

                        {/* Copy Link */}
                        <button 
                          onClick={(e) => handleCopySnippet(asset.fileUrl, 'URL', e)}
                          className="media-action-btn"
                          title="Copy URL"
                        >
                          <FiCopy size={16} />
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

                        {/* Delete Asset */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(asset); }}
                          className="media-action-btn btn-delete"
                          title={isInUse ? "In active use" : "Delete permanently"}
                        >
                          {isInUse ? <FiLock size={16} style={{ color: '#f59e0b' }} /> : <FiTrash2 size={16} />}
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
                        {asset.folder || (isImage ? 'Image' : isPdf ? 'PDF' : isVideo ? 'Video' : 'File')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ASSET DETAILS INSPECTOR DRAWER (RIGHT PANEL) */}
      {selectedAsset && (
        <>
          <div className="dam-inspector-overlay" onClick={() => setSelectedAsset(null)} />
          <div className="dam-inspector-panel">
            <div className="dam-inspector-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>Asset Details</h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Cloudinary Media Metadata</span>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Asset Large Preview Box */}
            <div className="dam-inspector-preview" style={{ cursor: 'pointer' }} onClick={() => setLightboxAsset(selectedAsset)}>
              {['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes((selectedAsset.fileType || '').toLowerCase()) || selectedAsset.fileType?.startsWith('image/') ? (
                <img src={selectedAsset.fileUrl} alt={selectedAsset.fileName} />
              ) : selectedAsset.fileType === 'pdf' || selectedAsset.fileName?.endsWith('.pdf') ? (
                <div className="pdf-gradient-bg">
                  <FiFileText size={48} style={{ marginBottom: '8px' }} />
                  <span>PDF Document</span>
                </div>
              ) : selectedAsset.fileType === 'mp4' || selectedAsset.fileType?.startsWith('video/') ? (
                <div className="video-gradient-bg">
                  <FiVideo size={48} style={{ marginBottom: '8px' }} />
                  <span>Video Asset</span>
                </div>
              ) : (
                <div className="file-gradient-bg">
                  <FiFileText size={48} style={{ marginBottom: '8px' }} />
                  <span>File Asset</span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiMaximize2 size={12} /> Full Preview
              </div>
            </div>

            {/* Used In List */}
            <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Used In Section(s):
              </span>
              {Array.isArray(selectedAsset.usedIn) && selectedAsset.usedIn.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedAsset.usedIn.map((section, idx) => (
                    <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                      🟢 {section}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>⚪ Unused (Safe to delete)</span>
              )}
            </div>

            {/* Quick Copy Snippets */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Copy Code Snippets:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button className="admin-btn admin-btn-secondary" style={{ fontSize: '12px', justifyContent: 'center' }} onClick={(e) => handleCopySnippet(selectedAsset.fileUrl, 'URL', e)}>
                  {copiedFormat === 'URL' ? <FiCheck /> : <FiCopy />} Copy URL
                </button>

                <button className="admin-btn admin-btn-secondary" style={{ fontSize: '12px', justifyContent: 'center' }} onClick={(e) => handleCopySnippet(selectedAsset.publicId || '', 'Public ID', e)}>
                  {copiedFormat === 'Public ID' ? <FiCheck /> : <FiCopy />} Public ID
                </button>

                <button className="admin-btn admin-btn-secondary" style={{ fontSize: '12px', justifyContent: 'center' }} onClick={(e) => handleCopySnippet(`<img src="${selectedAsset.fileUrl}" alt="${selectedAsset.fileName}" />`, 'HTML', e)}>
                  {copiedFormat === 'HTML' ? <FiCheck /> : <FiCopy />} HTML Tag
                </button>

                <button className="admin-btn admin-btn-secondary" style={{ fontSize: '12px', justifyContent: 'center' }} onClick={(e) => handleCopySnippet(`![${selectedAsset.fileName}](${selectedAsset.fileUrl})`, 'Markdown', e)}>
                  {copiedFormat === 'Markdown' ? <FiCheck /> : <FiCopy />} Markdown
                </button>
              </div>
            </div>

            {/* Full Metadata Listing */}
            <div className="dam-meta-list" style={{ marginBottom: '24px' }}>
              <div className="dam-meta-item">
                <span className="dam-meta-key">File Name:</span>
                <span className="dam-meta-val">{selectedAsset.fileName}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">Folder:</span>
                <span className="dam-meta-val">{selectedAsset.folder || 'General'}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">File Type & Format:</span>
                <span className="dam-meta-val">{(selectedAsset.format || selectedAsset.fileType || 'N/A').toUpperCase()}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">Dimensions:</span>
                <span className="dam-meta-val">{selectedAsset.width && selectedAsset.height ? `${selectedAsset.width} × ${selectedAsset.height} px` : 'N/A'}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">File Size:</span>
                <span className="dam-meta-val">{formatBytes(selectedAsset.fileSize)}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">Public ID:</span>
                <span className="dam-meta-val" style={{ fontSize: '11px' }}>{selectedAsset.publicId || 'N/A'}</span>
              </div>
              <div className="dam-meta-item">
                <span className="dam-meta-key">Created Date:</span>
                <span className="dam-meta-val">
                  {selectedAsset.createdAt ? new Date(selectedAsset.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              <label className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>
                <FiRefreshCw /> Replace Asset Content
                <input 
                  type="file" 
                  onChange={(e) => handleReplaceUpload(e, selectedAsset._id)} 
                  style={{ display: 'none' }} 
                />
              </label>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a 
                  href={selectedAsset.fileUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="admin-btn admin-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <FiArrowUpRight /> Open Asset
                </a>

                <button 
                  className="admin-btn admin-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                  onClick={() => setDeleteTarget(selectedAsset)}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {lightboxAsset && (
        <div className="dam-inspector-overlay" style={{ zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)' }} onClick={() => setLightboxAsset(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', background: '#0d0d11', border: '1px solid var(--admin-border)', borderRadius: '16px', overflow: 'hidden', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxAsset(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiX size={20} />
            </button>

            <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '16px', fontWeight: '700' }}>{lightboxAsset.fileName}</h4>

            {['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes((lightboxAsset.fileType || '').toLowerCase()) || lightboxAsset.fileType?.startsWith('image/') ? (
              <img src={lightboxAsset.fileUrl} alt={lightboxAsset.fileName} style={{ maxWidth: '85vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} />
            ) : lightboxAsset.fileType === 'pdf' || lightboxAsset.fileName?.endsWith('.pdf') ? (
              <iframe src={lightboxAsset.fileUrl} title="PDF Viewer" style={{ width: '80vw', height: '70vh', border: 'none', borderRadius: '8px' }} />
            ) : lightboxAsset.fileType === 'mp4' || lightboxAsset.fileType?.startsWith('video/') ? (
              <video src={lightboxAsset.fileUrl} controls autoPlay style={{ maxWidth: '85vw', maxHeight: '75vh', borderRadius: '8px' }} />
            ) : (
              <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>
                <FiFileText size={48} />
                <p>Preview not available for this file type.</p>
                <a href={lightboxAsset.fileUrl} target="_blank" rel="noreferrer" className="admin-btn admin-btn-primary">Download File</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="dam-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="dam-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: Array.isArray(deleteTarget.usedIn) && deleteTarget.usedIn.length > 0 ? '#fffbe6' : '#fef2f2',
                color: Array.isArray(deleteTarget.usedIn) && deleteTarget.usedIn.length > 0 ? '#d97706' : '#ef4444',
                border: '1px solid',
                borderColor: Array.isArray(deleteTarget.usedIn) && deleteTarget.usedIn.length > 0 ? '#fef3c7' : '#fecaca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                {Array.isArray(deleteTarget.usedIn) && deleteTarget.usedIn.length > 0 ? <FiLock /> : <FiTrash2 />}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0', letterSpacing: '-0.3px' }}>
                  {Array.isArray(deleteTarget.usedIn) && deleteTarget.usedIn.length > 0 ? 'Asset Is In Active Use' : 'Confirm Permanent Deletion'}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  Cloudinary & Database Asset Management
                </span>
              </div>
            </div>

            {Array.isArray(deleteTarget.usedIn) && deleteTarget.usedIn.length > 0 ? (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                  Cannot delete <strong style={{ color: '#0f172a' }}>"{deleteTarget.fileName}"</strong> because it is currently consumed by:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {deleteTarget.usedIn.map((sec, idx) => (
                    <span key={idx} style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                      📍 {sec}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Please replace or remove this asset from the sections above before deleting it.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                Are you sure you want to permanently delete <strong style={{ color: '#0f172a' }}>"{deleteTarget.fileName}"</strong>? This action cannot be undone.
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="admin-modal-cancel-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Close
              </button>
              {!(Array.isArray(deleteTarget.usedIn) && deleteTarget.usedIn.length > 0) && (
                <button 
                  className="admin-modal-delete-btn"
                  onClick={handleDeleteSingle}
                >
                  Delete Asset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {bulkDeleteConfirm && (
        <div className="dam-modal-backdrop" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="dam-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                <FiTrash2 />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                  Bulk Delete {selectedIds.length} Assets
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  Cloudinary & Database Batch Operation
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              Are you sure you want to delete the selected <strong style={{ color: '#0f172a' }}>{selectedIds.length} assets</strong>?
            </p>
            <p style={{ fontSize: '13px', color: '#64748b', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '0 0 24px 0' }}>
              ℹ️ Assets currently in active use by any portfolio section will automatically be protected from deletion.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="admin-modal-cancel-btn"
                onClick={() => setBulkDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="admin-modal-delete-btn"
                onClick={handleBulkDelete}
              >
                Proceed Bulk Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
