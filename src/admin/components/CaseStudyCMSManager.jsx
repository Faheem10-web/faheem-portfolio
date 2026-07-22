import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  FiUploadCloud, FiTrash2, FiRefreshCw,
  FiCheck, FiCopy, FiEye, FiSave, FiAlertCircle, 
  FiLink, FiCheckCircle, FiPlus, FiX
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
 * Image Section Card Component with Full Drag & Drop + Upload Features
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
  const { uploadCaseStudyFile } = useAdmin();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof imageObj === 'string' ? imageObj : imageObj?.url || '';
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
      setErrorMessage(err.message || 'An error occurred during upload.');
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

  const handleCopyUrl = () => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    onSaveImage({
      url: customUrl.trim(),
      alt: altText || title,
      filename: 'External Link',
      uploadedAt: new Date().toISOString()
    });
    setShowUrlInput(false);
    showSuccess('Custom image URL updated!');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove the ${title}?`)) {
      onRemoveImage();
      showSuccess(`${title} removed.`);
    }
  };

  const handleLoadDemo = () => {
    if (!defaultDemoAsset) return;
    onSaveImage({
      url: defaultDemoAsset,
      alt: title,
      filename: 'Demo Asset',
      uploadedAt: new Date().toISOString()
    });
    showSuccess('Loaded demo image asset!');
  };

  const inputId = `file-input-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid #EAEAEA',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{icon || '🖼️'}</span> {title}
          </h3>
          {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>{subtitle}</p>}
        </div>

        {currentUrl && (
          <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiCheck size={14} /> Asset Active
          </span>
        )}
      </div>

      {successToast && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCheckCircle /> {successToast}
        </div>
      )}

      {errorMessage && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiAlertCircle size={16} /> {errorMessage}
        </div>
      )}

      {currentUrl ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
          <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#0a0a0f', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={currentUrl} alt={currentAlt} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
              <button type="button" onClick={handleCopyUrl} style={{ background: 'rgba(0,0,0,0.75)', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copied ? <FiCheck /> : <FiCopy />} {copied ? 'Copied' : 'Copy Link'}
              </button>
              <a href={currentUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiEye /> View Full
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: '12px', border: '1px solid #F3F4F6', fontSize: '12px', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>Asset Name:</strong> {currentFilename || title}</div>
              <div><strong>Resolution:</strong> {currentDimensions}</div>
              <div><strong>Size:</strong> {FormatBytes(currentSize)}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <label htmlFor={inputId} style={{ flex: 1, background: '#4F46E5', color: '#ffffff', padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FiRefreshCw /> Upload New File
                <input type="file" accept="image/*" id={inputId} onChange={e => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
              </label>

              <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiLink /> {showUrlInput ? 'Hide Paste URL' : 'Paste Link'}
              </button>

              <button type="button" onClick={handleDelete} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiTrash2 /> Remove
              </button>
            </div>

            {showUrlInput && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input type="text" value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="Paste direct image URL (https://...)" style={{ flex: 1, padding: '8px 12px', border: '1px solid #4F46E5', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }} />
                <button type="button" onClick={handleApplyCustomUrl} style={{ background: '#4F46E5', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  Save Link
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} style={{ border: `2px dashed ${isDragging ? '#4F46E5' : '#D1D5DB'}`, borderRadius: '16px', padding: '28px 20px', textAlign: 'center', background: isDragging ? '#EEF2FF' : '#F9FAFB', transition: 'all 0.2s ease' }}>
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#4F46E5' }}>Uploading image asset... {progress}%</div>
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
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>JPG, PNG, WEBP, AVIF, SVG (Max 15MB)</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <label htmlFor={inputId} style={{ background: '#4F46E5', color: '#ffffff', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-block' }}>
                  Choose File
                  <input type="file" accept="image/*" id={inputId} onChange={e => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
                </label>

                {defaultDemoAsset && (
                  <button type="button" onClick={handleLoadDemo} style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Load Demo Image
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
 * Main Clean 100% Functional Case Study CMS Manager
 */
export default function CaseStudyCMSManager({ project, onSaveComplete }) {
  const { updateCaseStudy } = useAdmin();
  const [activeTab, setActiveTab] = useState('images'); // 'images' | 'text' | 'info' | 'seo'
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. All Case Study Image Assets State
  const [heroImage, setHeroImage] = useState(project?.heroImage || project?.bannerImage || '');
  const [challengeImage, setChallengeImage] = useState(project?.challengeImage || '');
  const [solutionImage, setSolutionImage] = useState(project?.solutionImage || '');
  const [conclusionImage, setConclusionImage] = useState(project?.conclusionImage || '');

  // 2. Editorial Text Content State
  const defaultOverviewIntro = "is a premium interior design platform crafted to bridge the gap between aesthetic inspiration and architectural execution. The objective was to develop a sophisticated, high-performance web experience that showcases luxury spaces while providing an effortless navigation system for potential clients. We implemented a clean, grid-based design language to emphasize visual storytelling and high-resolution imagery.";
  const defaultSecondaryDesc = "The final product delivers a seamless browsing experience tailored for high-end clientele. The result is a refined digital presence that balances artistic expression with functional lead generation.";

  const [overviewHeading, setOverviewHeading] = useState(project?.overviewConfig?.heading || `${project?.name || 'Project'}: Elevating Interior Design Through Digital Innovation`);
  const [overviewIntro, setOverviewIntro] = useState(project?.overviewConfig?.intro || defaultOverviewIntro);
  const [secondaryDesc, setSecondaryDesc] = useState(project?.secondaryDesc || defaultSecondaryDesc);
  
  const [challengeIntro, setChallengeIntro] = useState(project?.challengeIntro || `The primary hurdle for the ${project?.name || 'NEXTO'} project was presenting a vast portfolio of diverse design styles without overwhelming the user. We needed to organize complex architectural data into an intuitive interface that maintains a sense of luxury and space.`);
  const [challengePoints, setChallengePoints] = useState(project?.challengePoints && project?.challengePoints.length > 0 ? project.challengePoints : [
    "Cluttered navigation is affecting high-end brand perception.",
    "Slow load times for high-resolution gallery assets.",
    "Inconsistent user journeys from inspiration to booking."
  ]);
  const [challengeConclusion, setChallengeConclusion] = useState(project?.challengeConclusion || "We engineered a lightweight CMS structure that prioritizes performance and clarity. The visual hierarchy was elevated with minimalist UI elements, ensuring that the design work remains the focal point for every visitor.");

  const [solutionIntro, setSolutionIntro] = useState(project?.solutionIntro || 'Our solution centered on a "Visual-First" philosophy, simplifying the user’s path to discovery through thoughtful interaction design. We created streamlined user flows that make exploring design concepts and scheduling consultations effortless.');
  const [solutionPoints, setSolutionPoints] = useState(project?.solutionPoints && project?.solutionPoints.length > 0 ? project.solutionPoints : [
    { title: "Adaptive Masonry Grid", desc: "To showcase projects of varying scales and orientations." },
    { title: "Seamless CMS Integration", desc: "For easy portfolio updates and category filtering." },
    { title: "Interactive Style Quiz", desc: "To guide users toward their preferred aesthetic." },
    { title: "Optimized Performance", desc: "Ensuring 99th percentile load speeds for media-heavy pages." }
  ]);

  // 3. Project Information State
  const [projectName, setProjectName] = useState(project?.name || '');
  const [client, setClient] = useState(project?.client || 'Digital Client');
  const [industry, setIndustry] = useState(project?.infoConfig?.industry || 'Digital Product Design');
  const [timeline, setTimeline] = useState(project?.infoConfig?.timeline || '2 - 3 Weeks');
  const [year, setYear] = useState(project?.year || '2026');
  const [category, setCategory] = useState(project?.category || 'Product Design');
  const [liveUrl, setLiveUrl] = useState(project?.links?.liveProject || project?.liveUrl || '');

  // 4. SEO State
  const [metaTitle, setMetaTitle] = useState(project?.seoConfig?.metaTitle || project?.name || '');
  const [metaDescription, setMetaDescription] = useState(project?.seoConfig?.metaDescription || project?.shortDesc || '');

  useEffect(() => {
    if (project) {
      setHeroImage(project.heroImage || project.bannerImage || '');
      setChallengeImage(project.challengeImage || '');
      setSolutionImage(project.solutionImage || '');
      setConclusionImage(project.conclusionImage || '');

      setOverviewHeading(project.overviewConfig?.heading || `${project.name || 'Project'}: Elevating Interior Design Through Digital Innovation`);
      setOverviewIntro(project.overviewConfig?.intro || defaultOverviewIntro);
      setSecondaryDesc(project.secondaryDesc || defaultSecondaryDesc);

      setChallengeIntro(project.challengeIntro || `The primary hurdle for the ${project.name || 'NEXTO'} project was presenting a vast portfolio of diverse design styles without overwhelming the user. We needed to organize complex architectural data into an intuitive interface that maintains a sense of luxury and space.`);
      setChallengePoints(project.challengePoints && project.challengePoints.length > 0 ? project.challengePoints : [
        "Cluttered navigation is affecting high-end brand perception.",
        "Slow load times for high-resolution gallery assets.",
        "Inconsistent user journeys from inspiration to booking."
      ]);
      setChallengeConclusion(project.challengeConclusion || "We engineered a lightweight CMS structure that prioritizes performance and clarity. The visual hierarchy was elevated with minimalist UI elements, ensuring that the design work remains the focal point for every visitor.");

      setSolutionIntro(project.solutionIntro || 'Our solution centered on a "Visual-First" philosophy, simplifying the user’s path to discovery through thoughtful interaction design. We created streamlined user flows that make exploring design concepts and scheduling consultations effortless.');
      setSolutionPoints(project.solutionPoints && project.solutionPoints.length > 0 ? project.solutionPoints : [
        { title: "Adaptive Masonry Grid", desc: "To showcase projects of varying scales and orientations." },
        { title: "Seamless CMS Integration", desc: "For easy portfolio updates and category filtering." },
        { title: "Interactive Style Quiz", desc: "To guide users toward their preferred aesthetic." },
        { title: "Optimized Performance", desc: "Ensuring 99th percentile load speeds for media-heavy pages." }
      ]);

      setProjectName(project.name || '');
      setClient(project.client || 'Digital Client');
      setIndustry(project.infoConfig?.industry || 'Digital Product Design');
      setTimeline(project.infoConfig?.timeline || '2 - 3 Weeks');
      setYear(project.year || '2026');
      setCategory(project.category || 'Product Design');
      setLiveUrl(project.links?.liveProject || project.liveUrl || '');

      setMetaTitle(project.seoConfig?.metaTitle || project.name || '');
      setMetaDescription(project.seoConfig?.metaDescription || project.shortDesc || '');
    }
  }, [project]);

  const projectSlug = project?.slug || project?._id;

  const handleGlobalSave = async () => {
    if (!project?._id && !project?.slug) return;
    setIsSaving(true);

    const payload = {
      name: projectName,
      heroImage: typeof heroImage === 'object' ? heroImage.url : heroImage,
      bannerImage: typeof heroImage === 'object' ? heroImage.url : heroImage,
      challengeImage: typeof challengeImage === 'object' ? challengeImage.url : challengeImage,
      solutionImage: typeof solutionImage === 'object' ? solutionImage.url : solutionImage,
      conclusionImage: typeof conclusionImage === 'object' ? conclusionImage.url : conclusionImage,

      client,
      year,
      category,
      liveUrl,
      links: {
        ...(project?.links || {}),
        liveProject: liveUrl
      },
      infoConfig: {
        ...(project?.infoConfig || {}),
        industry,
        timeline
      },
      overviewConfig: {
        ...(project?.overviewConfig || {}),
        heading: overviewHeading,
        intro: overviewIntro
      },
      secondaryDesc,
      challengeIntro,
      challengePoints,
      challengeConclusion,
      solutionIntro,
      solutionPoints,
      seoConfig: { metaTitle, metaDescription }
    };

    const res = await updateCaseStudy(project._id || project.slug, payload);
    setIsSaving(false);

    if (res.success) {
      setToastMessage('Case Study updated & saved live to MongoDB!');
      setTimeout(() => setToastMessage(''), 3500);
      if (onSaveComplete) onSaveComplete(res.project);
    } else {
      alert(res.message || 'Failed to save changes.');
    }
  };

  const handleLivePreview = () => {
    window.open(`/projects/${projectSlug}`, '_blank');
  };

  // Helper functions for updating arrays
  const handleAddChallengePoint = () => {
    setChallengePoints([...challengePoints, 'New challenge point...']);
  };

  const handleUpdateChallengePoint = (idx, value) => {
    const updated = [...challengePoints];
    updated[idx] = value;
    setChallengePoints(updated);
  };

  const handleRemoveChallengePoint = (idx) => {
    setChallengePoints(challengePoints.filter((_, i) => i !== idx));
  };

  const handleAddSolutionPoint = () => {
    setSolutionPoints([...solutionPoints, { title: 'Feature Title', desc: 'Feature description...' }]);
  };

  const handleUpdateSolutionPoint = (idx, field, value) => {
    const updated = [...solutionPoints];
    if (typeof updated[idx] === 'string') {
      updated[idx] = { title: value, desc: '' };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setSolutionPoints(updated);
  };

  const handleRemoveSolutionPoint = (idx) => {
    setSolutionPoints(solutionPoints.filter((_, i) => i !== idx));
  };

  if (!project) return null;

  return (
    <div style={{ marginTop: '28px', position: 'relative' }}>
      
      {/* ── STICKY TOP-RIGHT CONTROL BAR ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid #EAEAEA',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚡ Case Study CMS Manager
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
            Live content management for <strong>{project.name}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button" 
            onClick={handleLivePreview}
            style={{
              background: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <FiEye size={16} /> Live Preview ↗
          </button>

          <button 
            type="button" 
            onClick={handleGlobalSave} 
            disabled={isSaving}
            style={{
              background: '#10B981',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <FiSave size={16} /> {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiCheckCircle size={18} /> {toastMessage}
        </div>
      )}

      {/* ── CLEAN 4-TAB NAVIGATION BAR ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #EAEAEA', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
            background: activeTab === 'images' ? '#111827' : '#F3F4F6', color: activeTab === 'images' ? '#ffffff' : '#374151',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          🖼️ Image Assets (Hero, Challenge, Solution, Conclusion)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
            background: activeTab === 'text' ? '#111827' : '#F3F4F6', color: activeTab === 'text' ? '#ffffff' : '#374151',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          ✍️ Editorial Text & Copy
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info')}
          style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
            background: activeTab === 'info' ? '#111827' : '#F3F4F6', color: activeTab === 'info' ? '#ffffff' : '#374151',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          📋 Project Details & Link
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          style={{
            padding: '10px 20px', borderRadius: '12px', border: 'none', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
            background: activeTab === 'seo' ? '#111827' : '#F3F4F6', color: activeTab === 'seo' ? '#ffffff' : '#374151',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          🌐 SEO Settings
        </button>
      </div>

      {/* ── TAB 1: ALL CASE STUDY IMAGE ASSETS ── */}
      {activeTab === 'images' && (
        <div>
          <ImageSectionCard 
            icon="🌄"
            title="Hero Banner Cover Image" 
            subtitle="Full edge-to-edge cover image displayed at the very top of the Case Study page"
            imageObj={heroImage}
            defaultDemoAsset="/assets/project_eco_shades.jpg"
            onSaveImage={setHeroImage}
            onRemoveImage={() => setHeroImage('')}
          />

          <ImageSectionCard 
            icon="🎯"
            title="The Challenge Mockup Image" 
            subtitle="Featured mockup image displayed alongside The Challenge section"
            imageObj={challengeImage}
            defaultDemoAsset="/assets/mockup_challenge.png"
            onSaveImage={setChallengeImage}
            onRemoveImage={() => setChallengeImage('')}
          />

          <ImageSectionCard 
            icon="💡"
            title="The Solution Mockup Image" 
            subtitle="Featured mockup image displayed alongside The Solution section"
            imageObj={solutionImage}
            defaultDemoAsset="/assets/mockup_solution.png"
            onSaveImage={setSolutionImage}
            onRemoveImage={() => setSolutionImage('')}
          />

          <ImageSectionCard 
            icon="🏁"
            title="Conclusion Mockup Image" 
            subtitle="Final mockup image displayed at the conclusion of the case study"
            imageObj={conclusionImage}
            defaultDemoAsset="/assets/mockup_conclusion.png"
            onSaveImage={setConclusionImage}
            onRemoveImage={() => setConclusionImage('')}
          />
        </div>
      )}

      {/* ── TAB 2: EDITORIAL TEXT & COPY ── */}
      {activeTab === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Overview Section Copy */}
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
              📌 Overview Section Copy
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Section Main Title</label>
                <input type="text" value={overviewHeading} onChange={e => setOverviewHeading(e.target.value)} placeholder={`e.g. ${projectName}: Elevating Interior Design Through Digital Innovation`} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Overview Intro Paragraph</label>
                <textarea value={overviewIntro} onChange={e => setOverviewIntro(e.target.value)} rows={3} placeholder="Introductory paragraph detailing objective and visual design language..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Secondary Description Paragraph</label>
                <textarea value={secondaryDesc} onChange={e => setSecondaryDesc(e.target.value)} rows={2} placeholder="The final product delivers a seamless browsing experience..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* The Challenge Section Copy */}
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
              🎯 The Challenge Section Copy & Bullet Points
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Challenge Intro Paragraph</label>
                <textarea value={challengeIntro} onChange={e => setChallengeIntro(e.target.value)} rows={3} placeholder="The primary hurdle for the project was presenting a vast portfolio..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>Challenge Bullet Points</label>
                  <button type="button" onClick={handleAddChallengePoint} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiPlus /> Add Point
                  </button>
                </div>
                {challengePoints.map((point, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" value={point} onChange={e => handleUpdateChallengePoint(idx, e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }} />
                    <button type="button" onClick={() => handleRemoveChallengePoint(idx)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Challenge Conclusion Paragraph</label>
                <textarea value={challengeConclusion} onChange={e => setChallengeConclusion(e.target.value)} rows={2} placeholder="We engineered a lightweight CMS structure..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* The Solution Section Copy */}
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
              💡 The Solution Section Copy & Feature Points
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Solution Intro Paragraph</label>
                <textarea value={solutionIntro} onChange={e => setSolutionIntro(e.target.value)} rows={3} placeholder='Our solution centered on a "Visual-First" philosophy...' style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>Solution Feature Points (Title + Description)</label>
                  <button type="button" onClick={handleAddSolutionPoint} style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiPlus /> Add Feature
                  </button>
                </div>
                {solutionPoints.map((item, idx) => {
                  const titleVal = typeof item === 'string' ? item : item.title || '';
                  const descVal = typeof item === 'string' ? '' : item.desc || '';
                  return (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <input type="text" value={titleVal} onChange={e => handleUpdateSolutionPoint(idx, 'title', e.target.value)} placeholder="Feature Title" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }} />
                      <input type="text" value={descVal} onChange={e => handleUpdateSolutionPoint(idx, 'desc', e.target.value)} placeholder="Feature Description" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }} />
                      <button type="button" onClick={() => handleRemoveSolutionPoint(idx)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                        <FiX size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3: PROJECT DETAILS & LINK ── */}
      {activeTab === 'info' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #EAEAEA', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
            📋 Project Info Box Fields
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Project Name</label>
              <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Client Name</label>
              <input type="text" value={client} onChange={e => setClient(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Duration / Timeline</label>
              <input type="text" value={timeline} onChange={e => setTimeline(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Published Year</label>
              <input type="text" value={year} onChange={e => setYear(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Category</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Industry</label>
              <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Live Preview Website Link</label>
              <input type="text" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://yourproject.com" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SEO SETTINGS ── */}
      {activeTab === 'seo' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #EAEAEA', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>SEO Meta Title</label>
            <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>SEO Meta Description</label>
            <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      )}

    </div>
  );
}
