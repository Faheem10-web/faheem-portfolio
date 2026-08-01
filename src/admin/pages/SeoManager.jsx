import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGlobe, FiShare2, FiTwitter, FiCheckCircle, FiAlertTriangle, 
  FiUploadCloud, FiTrash2, FiSave, FiEye, FiX,
  FiTag, FiSliders, FiMaximize2
} from 'react-icons/fi';
import { FaWhatsapp, FaLinkedin, FaFacebook, FaTelegram, FaTwitter } from 'react-icons/fa';
import { useAdmin } from '../../context/AdminContext';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

export default function SeoManager() {
  const { siteSettings, updateSeoSettings, uploadMediaFile, deleteCloudinaryMedia } = useAdmin();
  
  const seoData = siteSettings?.seo || {};

  // 1. Website SEO State
  const [siteTitle, setSiteTitle] = useState(seoData.siteTitle || 'Faheem - Premium UI/UX Portfolio');
  const [metaDescription, setMetaDescription] = useState(seoData.metaDescription || 'Interactive and modern portfolio website showcasing dynamic frontend development and UI/UX engineering.');
  const [keywords, setKeywords] = useState(Array.isArray(seoData.keywords) ? seoData.keywords : ['portfolio', 'uiux', 'developer', 'react']);
  const [tagInput, setTagInput] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState(seoData.canonicalUrl || 'https://faheem.design');
  const [author, setAuthor] = useState(seoData.author || 'Faheem');
  const [robotsIndex, setRobotsIndex] = useState(seoData.robotsIndex || 'index, follow');

  // 2. Open Graph State
  const [ogTitle, setOgTitle] = useState(seoData.ogTitle || 'Faheem - Lead UI/UX Designer & Frontend Developer');
  const [ogDescription, setOgDescription] = useState(seoData.ogDescription || 'Explore interactive case studies, design systems, and digital product designs.');
  const [ogImage, setOgImage] = useState(seoData.ogImage || '');

  // 3. Twitter Card State
  const [twitterTitle, setTwitterTitle] = useState(seoData.twitterTitle || 'Faheem - Lead UI/UX Designer & Frontend Developer');
  const [twitterDescription, setTwitterDescription] = useState(seoData.twitterDescription || 'Explore interactive case studies, design systems, and digital product designs.');
  const [twitterImage, setTwitterImage] = useState(seoData.twitterImage || '');
  const [twitterUseOgImage, setTwitterUseOgImage] = useState(seoData.twitterUseOgImage !== false);
  const [twitterCardType, setTwitterCardType] = useState(seoData.twitterCardType || 'summary_large_image');

  // 4. Favicon State
  const [favicon, setFavicon] = useState(seoData.favicon || '');

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState('seo'); // 'seo' | 'og' | 'twitter' | 'favicon' | 'preview'
  const [activePreviewPlatform, setActivePreviewPlatform] = useState('whatsapp'); // 'whatsapp' | 'linkedin' | 'facebook' | 'twitter' | 'telegram'

  // Drag & Drop & Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTargetField, setUploadTargetField] = useState(null); // 'ogImage' | 'twitterImage' | 'favicon'
  const [dragActive, setDragActive] = useState(false);

  // Status & Notifications
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [isDirty, setIsDirty] = useState(false);

  // Sync state when siteSettings loads from API
  useEffect(() => {
    if (siteSettings?.seo) {
      const s = siteSettings.seo;
      setSiteTitle(s.siteTitle || 'Faheem - Premium UI/UX Portfolio');
      setMetaDescription(s.metaDescription || 'Interactive and modern portfolio website showcasing dynamic frontend development and UI/UX engineering.');
      setKeywords(Array.isArray(s.keywords) ? s.keywords : ['portfolio', 'uiux', 'developer', 'react']);
      setCanonicalUrl(s.canonicalUrl || 'https://faheem.design');
      setAuthor(s.author || 'Faheem');
      setRobotsIndex(s.robotsIndex || 'index, follow');

      setOgTitle(s.ogTitle || 'Faheem - Lead UI/UX Designer & Frontend Developer');
      setOgDescription(s.ogDescription || 'Explore interactive case studies, design systems, and digital product designs.');
      setOgImage(s.ogImage || '');

      setTwitterTitle(s.twitterTitle || 'Faheem - Lead UI/UX Designer & Frontend Developer');
      setTwitterDescription(s.twitterDescription || 'Explore interactive case studies, design systems, and digital product designs.');
      setTwitterImage(s.twitterImage || '');
      setTwitterUseOgImage(s.twitterUseOgImage !== false);
      setTwitterCardType(s.twitterCardType || 'summary_large_image');

      setFavicon(s.favicon || '');
      setIsDirty(false);
    }
  }, [siteSettings]);

  // Mark form as dirty when fields change
  const markDirty = () => setIsDirty(true);

  // Toast Helper
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3500);
  };

  // Keywords Tag Handlers
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim().toLowerCase();
    if (!keywords.includes(cleanTag)) {
      setKeywords([...keywords, cleanTag]);
      markDirty();
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setKeywords(keywords.filter(t => t !== tagToRemove));
    markDirty();
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Cloudinary File Upload Handler
  const handleFileUpload = async (file, targetField) => {
    if (!file) return;

    // File Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.ico')) {
      showToast('error', 'Unsupported format. Please upload JPG, PNG, WEBP, ICO, or SVG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showToast('error', 'File size exceeds 5MB limit. Please compress your image.');
      return;
    }

    setIsUploading(true);
    setUploadTargetField(targetField);
    setUploadProgress(20);

    try {
      setUploadProgress(60);
      const res = await uploadMediaFile(file);
      setUploadProgress(100);

      if (res && (res.url || res.fileUrl)) {
        const uploadedUrl = res.url || res.fileUrl;
        if (targetField === 'ogImage') setOgImage(uploadedUrl);
        else if (targetField === 'twitterImage') setTwitterImage(uploadedUrl);
        else if (targetField === 'favicon') setFavicon(uploadedUrl);

        markDirty();
        showToast('success', res.isLocalFallback ? `Image uploaded to storage!` : `Image uploaded & optimized via Cloudinary!`);
      } else {
        showToast('error', res?.message || 'Failed to upload image.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      showToast('error', err.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
      setUploadTargetField(null);
      setUploadProgress(0);
    }
  };

  // Drag and Drop Event Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e, targetField) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], targetField);
    }
  };

  // Save Settings Handler
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const payload = {
      siteTitle,
      metaDescription,
      keywords,
      canonicalUrl,
      author,
      robotsIndex,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      twitterUseOgImage,
      twitterCardType,
      favicon
    };

    const res = await updateSeoSettings(payload);
    setIsSaving(false);

    if (res.success) {
      setIsDirty(false);
      showToast('success', 'SEO & Social Sharing settings saved & published!');
    } else {
      showToast('error', res.message || 'Failed to save SEO settings.');
    }
  };

  // Effective Social Card Values for Live Previews
  const effectiveOgImage = ogImage || 'https://i.pinimg.com/736x/5a/c5/1a/5ac51a73d86fdfcde5935a8f9a521c10.jpg';
  const effectiveTwitterImage = twitterUseOgImage ? effectiveOgImage : (twitterImage || effectiveOgImage);
  const domainName = canonicalUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'faheem.design';

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{ 
              position: 'fixed', bottom: '32px', right: '32px', zIndex: 9999,
              background: toast.type === 'success' ? '#10B981' : '#EF4444',
              color: '#FFFFFF', padding: '14px 24px', borderRadius: '14px',
              fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)'
            }}
          >
            {toast.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertTriangle size={20} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
              SEO & Social Sharing Management
            </h1>
            {isDirty && (
              <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                Unsaved Changes *
              </span>
            )}
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6B7280' }}>
            Manage Website Meta Tags, Open Graph Banners, Twitter Cards & Favicon in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            color: '#FFFFFF', border: 'none', padding: '12px 28px', borderRadius: '12px',
            fontSize: '14px', fontWeight: '700', cursor: isSaving ? 'wait' : 'pointer',
            boxShadow: '0 10px 24px rgba(139, 92, 246, 0.35)', transition: 'all 0.2s ease'
          }}
        >
          {isSaving ? (
            <>
              <div className="cs-loading-spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <FiSave size={18} />
              <span>Save SEO Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation Navigation Bar */}
      <div style={{ display: 'flex', gap: '8px', background: '#F3F4F6', padding: '6px', borderRadius: '16px', marginBottom: '32px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          style={{
            flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', border: 'none', cursor: 'pointer',
            background: activeTab === 'seo' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'seo' ? '#6D28D9' : '#4B5563',
            boxShadow: activeTab === 'seo' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease', whiteSpace: 'nowrap'
          }}
        >
          <FiGlobe size={16} /> 1. Website SEO
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('og')}
          style={{
            flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', border: 'none', cursor: 'pointer',
            background: activeTab === 'og' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'og' ? '#6D28D9' : '#4B5563',
            boxShadow: activeTab === 'og' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease', whiteSpace: 'nowrap'
          }}
        >
          <FiShare2 size={16} /> 2. Open Graph (FB, WA, LinkedIn)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('twitter')}
          style={{
            flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', border: 'none', cursor: 'pointer',
            background: activeTab === 'twitter' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'twitter' ? '#6D28D9' : '#4B5563',
            boxShadow: activeTab === 'twitter' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease', whiteSpace: 'nowrap'
          }}
        >
          <FiTwitter size={16} /> 3. Twitter Cards
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favicon')}
          style={{
            flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', border: 'none', cursor: 'pointer',
            background: activeTab === 'favicon' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'favicon' ? '#6D28D9' : '#4B5563',
            boxShadow: activeTab === 'favicon' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease', whiteSpace: 'nowrap'
          }}
        >
          <FiSliders size={16} /> 4. Favicon Manager
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          style={{
            flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', border: 'none', cursor: 'pointer',
            background: activeTab === 'preview' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'preview' ? '#6D28D9' : '#4B5563',
            boxShadow: activeTab === 'preview' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease', whiteSpace: 'nowrap'
          }}
        >
          <FiEye size={16} /> 5. Live Social Preview
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: WEBSITE SEO                                                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'seo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '17px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiGlobe color="#8B5CF6" /> Website Search Engine Optimization
            </h3>

            {/* Website Title */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: '700', color: '#374151' }}>
                  Website Title (document.title)
                </label>
                <span style={{ fontSize: '12px', fontWeight: '700', color: siteTitle.length > 60 ? '#EF4444' : siteTitle.length >= 30 ? '#10B981' : '#F59E0B' }}>
                  {siteTitle.length} / 60 Chars {siteTitle.length > 60 && '⚠️ Too Long'}
                </span>
              </div>
              <input
                type="text"
                value={siteTitle}
                onChange={e => { setSiteTitle(e.target.value); markDirty(); }}
                placeholder="Faheem - Premium UI/UX Designer & Frontend Portfolio"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                Recommended length: 30–60 characters. Appears as main link header in search engine results.
              </p>
            </div>

            {/* Meta Description */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: '700', color: '#374151' }}>
                  Meta Description
                </label>
                <span style={{ fontSize: '12px', fontWeight: '700', color: metaDescription.length > 160 ? '#EF4444' : metaDescription.length >= 100 ? '#10B981' : '#F59E0B' }}>
                  {metaDescription.length} / 160 Chars {metaDescription.length > 160 && '⚠️ Too Long'}
                </span>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={e => { setMetaDescription(e.target.value); markDirty(); }}
                placeholder="Interactive and modern portfolio website showcasing dynamic frontend development and UI/UX engineering."
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                Recommended length: 70–160 characters. Provide a crisp summary of your portfolio.
              </p>
            </div>

            {/* Keywords Tag Pill Editor */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Meta Keywords Tag Manager
              </label>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', borderRadius: '12px', border: '1px solid #D1D5DB', background: '#F9FAFB', marginBottom: '10px' }}>
                {keywords.map((tag, idx) => (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EDE9FE', color: '#6D28D9', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                    <FiTag size={12} /> {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6D28D9', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <FiX size={14} />
                    </button>
                  </span>
                ))}

                <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type keyword & press Enter or comma..."
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', color: '#111827' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    style={{ background: '#8B5CF6', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* Grid 2 Columns: Canonical URL & Author */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  Canonical URL (canonical link)
                </label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={e => { setCanonicalUrl(e.target.value); markDirty(); }}
                  placeholder="https://faheem.design"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  Author (meta author)
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={e => { setAuthor(e.target.value); markDirty(); }}
                  placeholder="Faheem"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Robots Index / Follow Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Search Engine Robots Indexing (meta robots)
              </label>
              <select
                value={robotsIndex}
                onChange={e => { setRobotsIndex(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#FFFFFF' }}
              >
                <option value="index, follow">✅ Index, Follow (Recommended - Allow search engines to index site & follow links)</option>
                <option value="noindex, follow">⚠️ NoIndex, Follow (Hide from search results but follow links)</option>
                <option value="index, nofollow">⚠️ Index, NoFollow (Index site but ignore outgoing links)</option>
                <option value="noindex, nofollow">🛑 NoIndex, NoFollow (Block search engines entirely)</option>
              </select>
            </div>

          </div>

        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: OPEN GRAPH (Facebook, WhatsApp, LinkedIn, Discord)                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'og' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiShare2 color="#8B5CF6" /> Open Graph Banner & Social Cards (WhatsApp, Facebook, LinkedIn)
              </h3>
              <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FiMaximize2 size={13} /> Recommended Banner Size: 1200 × 630 px
              </span>
            </div>

            {/* OG Banner Drag & Drop Cloudinary Uploader */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Social Banner Image (og:image)
              </label>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={e => handleDrop(e, 'ogImage')}
                style={{
                  border: `2px dashed ${dragActive ? '#8B5CF6' : '#D1D5DB'}`,
                  borderRadius: '16px', padding: '32px 24px', textAlign: 'center',
                  background: dragActive ? '#F5F3FF' : '#FAFAFA',
                  transition: 'all 0.2s ease', cursor: 'pointer'
                }}
              >
                {ogImage ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '480px', aspectRatio: '1200 / 630', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}>
                      <img src={getOptimizedImageUrl(ogImage, { width: 1200 })} alt="Open Graph Social Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <label style={{ background: '#8B5CF6', color: '#FFFFFF', padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FiUploadCloud size={16} /> Replace Banner Image
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e.target.files[0], 'ogImage')} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          if (ogImage.includes('res.cloudinary.com')) {
                            await deleteCloudinaryMedia(ogImage);
                          }
                          setOgImage('');
                          markDirty();
                          showToast('success', 'Social banner image removed.');
                        }}
                        style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FiTrash2 size={16} /> Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <FiUploadCloud size={42} color="#8B5CF6" style={{ marginBottom: '12px' }} />
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#111827' }}>
                      Drag & Drop your 1200×630 Open Graph Banner Image here
                    </h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6B7280' }}>
                      Supports PNG, JPG, WEBP formats up to 5MB. Cloudinary will auto-compress and optimize delivery.
                    </p>

                    <label style={{ background: '#111827', color: '#FFFFFF', padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-block' }}>
                      Browse Image File
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e.target.files[0], 'ogImage')} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                {/* Progress Bar */}
                {isUploading && uploadTargetField === 'ogImage' && (
                  <div style={{ marginTop: '20px', width: '100%', maxWidth: '360px', margin: '20px auto 0' }}>
                    <div style={{ height: '6px', width: '100%', background: '#E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#8B5CF6', transition: 'width 0.3s ease' }}></div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#8B5CF6', display: 'block', marginTop: '6px' }}>Uploading to Cloudinary... ({uploadProgress}%)</span>
                  </div>
                )}
              </div>
            </div>

            {/* OG Title */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Open Graph Title (og:title)
              </label>
              <input
                type="text"
                value={ogTitle}
                onChange={e => { setOgTitle(e.target.value); markDirty(); }}
                placeholder="Faheem - Lead UI/UX Designer & Frontend Developer"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* OG Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Open Graph Description (og:description)
              </label>
              <textarea
                rows={3}
                value={ogDescription}
                onChange={e => { setOgDescription(e.target.value); markDirty(); }}
                placeholder="Explore interactive case studies, design systems, and digital product designs."
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

          </div>

        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: TWITTER CARDS                                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'twitter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '17px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiTwitter color="#1DA1F2" /> Twitter / X Card Settings
            </h3>

            {/* Toggle Use Same Image as OG Image */}
            <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '16px 20px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                  Use Same Banner Image as Open Graph (og:image)
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#6B7280' }}>
                  Automatically reuse your 1200×630 Open Graph image for Twitter cards.
                </p>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                <input
                  type="checkbox"
                  checked={twitterUseOgImage}
                  onChange={e => { setTwitterUseOgImage(e.target.checked); markDirty(); }}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: twitterUseOgImage ? '#8B5CF6' : '#D1D5DB', borderRadius: '34px', transition: '.3s'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '18px', width: '18px', left: twitterUseOgImage ? '26px' : '4px', bottom: '4px',
                    backgroundColor: 'white', borderRadius: '50%', transition: '.3s'
                  }} />
                </span>
              </label>
            </div>

            {/* Custom Twitter Image Uploader if toggled OFF */}
            {!twitterUseOgImage && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  Custom Twitter Banner Image (twitter:image)
                </label>
                <div style={{ border: '2px dashed #D1D5DB', borderRadius: '16px', padding: '24px', textAlign: 'center', background: '#FAFAFA' }}>
                  {twitterImage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <img src={getOptimizedImageUrl(twitterImage, { width: 1200 })} alt="Twitter Banner" style={{ width: '100%', maxWidth: '400px', aspectRatio: '1200 / 630', objectFit: 'cover', borderRadius: '12px' }} />
                      <button type="button" onClick={() => { setTwitterImage(''); markDirty(); }} style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        Remove Custom Twitter Image
                      </button>
                    </div>
                  ) : (
                    <label style={{ background: '#111827', color: '#FFFFFF', padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-block' }}>
                      Upload Twitter Image
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e.target.files[0], 'twitterImage')} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Twitter Card Type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Twitter Card Type (twitter:card)
              </label>
              <select
                value={twitterCardType}
                onChange={e => { setTwitterCardType(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#FFFFFF' }}
              >
                <option value="summary_large_image">🖼️ Large Banner (summary_large_image - Recommended)</option>
                <option value="summary">📌 Small Thumbnail (summary)</option>
              </select>
            </div>

            {/* Twitter Title */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Twitter Title (twitter:title)
              </label>
              <input
                type="text"
                value={twitterTitle}
                onChange={e => { setTwitterTitle(e.target.value); markDirty(); }}
                placeholder="Faheem - Lead UI/UX Designer & Frontend Developer"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Twitter Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Twitter Description (twitter:description)
              </label>
              <textarea
                rows={3}
                value={twitterDescription}
                onChange={e => { setTwitterDescription(e.target.value); markDirty(); }}
                placeholder="Explore interactive case studies, design systems, and digital product designs."
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

          </div>

        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: FAVICON MANAGER                                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'favicon' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '17px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiSliders color="#8B5CF6" /> Favicon & Browser Icon Manager
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap', background: '#F9FAFB', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              
              {/* Favicon Live Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280' }}>Current Favicon</span>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  {favicon ? (
                    <img src={getOptimizedImageUrl(favicon, { width: 128 })} alt="Favicon Preview" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '24px' }}>🌐</span>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#111827' }}>
                  Upload Custom Website Favicon (favicon.ico / PNG / SVG)
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
                  Replaces the browser tab icon dynamically on the public portfolio. Supported formats: .ico, .png, .svg.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <label style={{ background: '#8B5CF6', color: '#FFFFFF', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FiUploadCloud size={16} /> Choose Favicon File
                    <input type="file" accept=".ico,image/x-icon,image/png,image/svg+xml" onChange={e => handleFileUpload(e.target.files[0], 'favicon')} style={{ display: 'none' }} />
                  </label>

                  {favicon && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (favicon.includes('res.cloudinary.com')) {
                          await deleteCloudinaryMedia(favicon);
                        }
                        setFavicon('');
                        markDirty();
                        showToast('success', 'Favicon reset to default.');
                      }}
                      style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FiTrash2 size={16} /> Remove Favicon
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: LIVE SOCIAL PREVIEW CARD                                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiEye color="#8B5CF6" /> Live Social Link Sharing Simulation
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#6B7280' }}>
              Real-time preview of how your portfolio link looks when shared across chat apps and social platforms.
            </p>

            {/* Social Platform Switcher Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActivePreviewPlatform('whatsapp')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  background: activePreviewPlatform === 'whatsapp' ? '#25D366' : '#F3F4F6',
                  color: activePreviewPlatform === 'whatsapp' ? '#FFFFFF' : '#374151'
                }}
              >
                <FaWhatsapp size={16} /> WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewPlatform('linkedin')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  background: activePreviewPlatform === 'linkedin' ? '#0A66C2' : '#F3F4F6',
                  color: activePreviewPlatform === 'linkedin' ? '#FFFFFF' : '#374151'
                }}
              >
                <FaLinkedin size={16} /> LinkedIn
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewPlatform('facebook')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  background: activePreviewPlatform === 'facebook' ? '#1877F2' : '#F3F4F6',
                  color: activePreviewPlatform === 'facebook' ? '#FFFFFF' : '#374151'
                }}
              >
                <FaFacebook size={16} /> Facebook
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewPlatform('twitter')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  background: activePreviewPlatform === 'twitter' ? '#1DA1F2' : '#F3F4F6',
                  color: activePreviewPlatform === 'twitter' ? '#FFFFFF' : '#374151'
                }}
              >
                <FaTwitter size={16} /> Twitter / X
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewPlatform('telegram')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  background: activePreviewPlatform === 'telegram' ? '#229ED9' : '#F3F4F6',
                  color: activePreviewPlatform === 'telegram' ? '#FFFFFF' : '#374151'
                }}
              >
                <FaTelegram size={16} /> Telegram
              </button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div style={{ background: '#0F172A', padding: '32px', borderRadius: '18px', display: 'flex', justifyContent: 'center' }}>
              
              {/* WhatsApp Card Preview */}
              {activePreviewPlatform === 'whatsapp' && (
                <div style={{ background: '#075E54', padding: '16px', borderRadius: '16px', width: '100%', maxWidth: '380px', color: '#FFF' }}>
                  <div style={{ background: '#054D44', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                    <div style={{ width: '100%', aspectRatio: '1200 / 630', background: '#1E293B', overflow: 'hidden' }}>
                      {effectiveOgImage ? (
                        <img src={getOptimizedImageUrl(effectiveOgImage, { width: 800 })} alt="WhatsApp Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>No OG Image</div>
                      )}
                    </div>
                    <div style={{ padding: '12px', background: '#043A33' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>{ogTitle || siteTitle}</h4>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#CBD5E1', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ogDescription || metaDescription}</p>
                      <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'lowercase' }}>{domainName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* LinkedIn Card Preview */}
              {activePreviewPlatform === 'linkedin' && (
                <div style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '520px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                  <div style={{ width: '100%', aspectRatio: '1200 / 630', background: '#F1F5F9', overflow: 'hidden' }}>
                    {effectiveOgImage ? (
                      <img src={getOptimizedImageUrl(effectiveOgImage, { width: 1000 })} alt="LinkedIn Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>No OG Image</div>
                    )}
                  </div>
                  <div style={{ padding: '14px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '700', color: '#0F172A' }}>{ogTitle || siteTitle}</h4>
                    <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>{domainName}</span>
                  </div>
                </div>
              )}

              {/* Facebook Card Preview */}
              {activePreviewPlatform === 'facebook' && (
                <div style={{ background: '#FFFFFF', borderRadius: '8px', width: '100%', maxWidth: '500px', overflow: 'hidden', border: '1px solid #DDD', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                  <div style={{ width: '100%', aspectRatio: '1200 / 630', background: '#F1F5F9', overflow: 'hidden' }}>
                    {effectiveOgImage ? (
                      <img src={getOptimizedImageUrl(effectiveOgImage, { width: 1000 })} alt="FB Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>No OG Image</div>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px', background: '#F2F3F5', borderTop: '1px solid #E5E5E5' }}>
                    <span style={{ fontSize: '11px', color: '#606770', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>{domainName}</span>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#1D2129' }}>{ogTitle || siteTitle}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#606770', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ogDescription || metaDescription}</p>
                  </div>
                </div>
              )}

              {/* Twitter Card Preview */}
              {activePreviewPlatform === 'twitter' && (
                <div style={{ background: '#000000', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', border: '1px solid #333', color: '#FFF' }}>
                  <div style={{ width: '100%', aspectRatio: twitterCardType === 'summary' ? '1/1' : '1200 / 630', background: '#16181C', overflow: 'hidden', maxHeight: twitterCardType === 'summary' ? '220px' : 'none' }}>
                    {effectiveTwitterImage ? (
                      <img src={getOptimizedImageUrl(effectiveTwitterImage, { width: 1000 })} alt="Twitter Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71767B' }}>No Twitter Image</div>
                    )}
                  </div>
                  <div style={{ padding: '12px 16px', background: '#000000' }}>
                    <span style={{ fontSize: '12px', color: '#71767B', display: 'block', marginBottom: '4px' }}>{domainName}</span>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#E7E9EA' }}>{twitterTitle || ogTitle || siteTitle}</h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#71767B', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{twitterDescription || ogDescription || metaDescription}</p>
                  </div>
                </div>
              )}

              {/* Telegram Card Preview */}
              {activePreviewPlatform === 'telegram' && (
                <div style={{ background: '#17212B', padding: '14px', borderRadius: '14px', width: '100%', maxWidth: '420px', color: '#FFF' }}>
                  <div style={{ borderLeft: '3px solid #64B5F6', paddingLeft: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64B5F6', display: 'block', marginBottom: '4px' }}>{domainName}</span>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: '700', color: '#F5F5F5' }}>{ogTitle || siteTitle}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#7F91A4', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ogDescription || metaDescription}</p>
                    <div style={{ width: '100%', aspectRatio: '1200 / 630', borderRadius: '8px', overflow: 'hidden', background: '#0E1621' }}>
                      {effectiveOgImage && (
                        <img src={getOptimizedImageUrl(effectiveOgImage, { width: 800 })} alt="Telegram Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
