import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import CaseStudyCMSManager from '../components/CaseStudyCMSManager';
import '../Admin.css';

function SectionGalleryUploader({ title, sectionName, images = [], onImagesChange, onSaveSection, isSaving }) {
  const { uploadMediaFile, uploadMultipleMediaFiles, deleteCloudinaryMedia } = useAdmin();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      return 'Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size exceeds 10MB limit.';
    }
    return null;
  };

  const processFiles = async (files) => {
    const filesArr = Array.from(files);
    if (filesArr.length === 0) return;
    setErrorMessage('');

    for (const f of filesArr) {
      const err = validateFile(f);
      if (err) {
        setErrorMessage(err);
        return;
      }
    }

    setIsUploading(true);

    try {
      let uploadedResults = [];
      if (filesArr.length === 1) {
        const res = await uploadMediaFile(filesArr[0]);
        if (res.success && res.url) {
          uploadedResults.push({ url: res.url, public_id: res.public_id || res.publicId || '' });
        } else {
          setErrorMessage(res.message || 'Image upload failed.');
        }
      } else {
        const res = await uploadMultipleMediaFiles(filesArr);
        if (res.success && res.files) {
          uploadedResults = res.files.map(f => ({ url: f.url, public_id: f.public_id || '' }));
        } else {
          setErrorMessage(res.message || 'Batch upload failed.');
        }
      }

      if (uploadedResults.length > 0) {
        const existingUrls = new Set(images.map(i => i.url));
        const newItems = uploadedResults.filter(i => !existingUrls.has(i.url));
        const updated = [...images, ...newItems];
        onImagesChange(updated);
        if (onSaveSection) {
          await onSaveSection(sectionName, updated);
        }
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      setErrorMessage(err.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteImage = async (indexToDelete) => {
    const target = images[indexToDelete];
    if (!target) return;
    if (target.public_id || target.url) {
      deleteCloudinaryMedia(target.public_id || target.url);
    }
    const updated = images.filter((_, idx) => idx !== indexToDelete);
    onImagesChange(updated);
    if (onSaveSection) {
      await onSaveSection(sectionName, updated);
    }
  };

  const handleReplaceImage = async (indexToReplace, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setErrorMessage(err);
      return;
    }

    setIsUploading(true);
    try {
      const oldImg = images[indexToReplace];
      const res = await uploadMediaFile(file);
      if (res.success && res.url) {
        if (oldImg && (oldImg.public_id || oldImg.url)) {
          deleteCloudinaryMedia(oldImg.public_id || oldImg.url);
        }
        const updated = [...images];
        updated[indexToReplace] = { url: res.url, public_id: res.public_id || res.publicId || '' };
        onImagesChange(updated);
        if (onSaveSection) {
          await onSaveSection(sectionName, updated);
        }
      } else {
        setErrorMessage(res.message || 'Replacement failed');
      }
    } catch (err) {
      console.error('Replace error:', err);
      setErrorMessage(err.message || 'Replacement failed');
    } finally {
      setIsUploading(false);
    }
  };

  const inputId = `file-input-${sectionName}`;

  return (
    <div style={{ marginTop: '14px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '13.5px', color: 'var(--admin-text)', fontWeight: 600, margin: 0 }}>
          {title} Gallery ({images.length} {images.length === 1 ? 'image' : 'images'})
        </h4>
        {onSaveSection && (
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary" 
            style={{ fontSize: '12px', padding: '4px 10px' }} 
            onClick={() => onSaveSection(sectionName, images)}
            disabled={isSaving || isUploading}
          >
            {isSaving ? 'Saving...' : 'Save Section'}
          </button>
        )}
      </div>

      {errorMessage && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '10px', background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '6px' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#25D366' : 'rgba(255,255,255,0.15)'}`,
          backgroundColor: isDragging ? 'rgba(37,211,102,0.05)' : 'rgba(0,0,0,0.15)',
          borderRadius: '10px',
          padding: '20px',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          marginBottom: images.length > 0 ? '14px' : '0'
        }}
      >
        {isUploading ? (
          <div style={{ color: '#25D366', fontSize: '13px', fontWeight: 600 }}>
            ⏳ Uploading to Cloudinary... Please wait.
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              Drag & drop gallery images here, or <span style={{ color: '#25D366', textDecoration: 'underline', cursor: 'pointer' }}>browse files</span>
            </p>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              JPG, PNG, WEBP, GIF, SVG (Max 10MB per file)
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => processFiles(e.target.files)}
              style={{ display: 'none' }}
              id={inputId}
            />
            <div style={{ marginTop: '10px' }}>
              <label htmlFor={inputId} className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '12px', display: 'inline-block' }}>
                Select Image Files
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Thumbnail Items */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000', height: '80px' }}>
              <img src={img.url} alt={`Gallery item ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'rgba(0,0,0,0.65)', 
                  opacity: 0, 
                  transition: 'opacity 0.2s', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px' 
                }} 
                onMouseEnter={e => e.currentTarget.style.opacity = 1} 
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <label style={{ cursor: 'pointer', color: '#fff', fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '4px' }}>
                  Replace
                  <input type="file" accept="image/*" onChange={(e) => handleReplaceImage(idx, e)} style={{ display: 'none' }} />
                </label>
                <button 
                  type="button" 
                  onClick={() => handleDeleteImage(idx)} 
                  style={{ color: '#ff4d4d', background: 'rgba(255,0,0,0.25)', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectManager() {
  const { projects, projectsCrud, uploadMediaFile } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Upload handler for setting direct URL
  const handleDirectUpload = async (e, setUrlCallback) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await uploadMediaFile(file);
    if (res.success && res.url) {
      setUrlCallback(res.url);
    } else {
      alert('Upload failed. Check server console.');
    }
  };

  // Upload handler for gallery (appends to list)
  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await uploadMediaFile(file);
    if (res.success && res.url) {
      setGallery(prev => prev ? `${prev}, ${res.url}` : res.url);
    } else {
      alert('Upload failed.');
    }
  };

  // Form Fields State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState('Completed');
  const [technologies, setTechnologies] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [caseStudyUrl, setCaseStudyUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [thumbnailImage, setThumbnailImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [challengeImage, setChallengeImage] = useState('');
  const [solutionImage, setSolutionImage] = useState('');
  const [resultImage, setResultImage] = useState('');
  const [challengeImages, setChallengeImages] = useState([]);
  const [solutionImages, setSolutionImages] = useState([]);
  const [resultImages, setResultImages] = useState([]);
  const [savingSection, setSavingSection] = useState('');
  const [gallery, setGallery] = useState('');
  const [challenge, setChallenge] = useState('');
  const [solution, setSolution] = useState('');
  const [results, setResults] = useState('');
  const [process, setProcess] = useState('');
  const [hasCaseStudy, setHasCaseStudy] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showOnHome, setShowOnHome] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [order, setOrder] = useState(0);

  // Fetch projects on load
  useEffect(() => {
    projectsCrud.getAll();
  }, []);

  const resetForm = () => {
    setName('');
    setSlug('');
    setCategory('UI/UX Design');
    setYear('2026');
    setClient('Faheem');
    setStatus('Completed');
    setTechnologies('React, Figma, TailwindCSS');
    setShortDesc('');
    setLongDesc('');
    setLiveUrl('');
    setCaseStudyUrl('');
    setGithubUrl('');
    setCoverImage('/assets/project_eco_shades.jpg');
    setThumbnailImage('/assets/project_eco_shades.jpg');
    setBannerImage('/assets/project_eco_shades.jpg');
    setChallengeImage('/assets/mockup_challenge.png');
    setSolutionImage('/assets/mockup_solution.png');
    setResultImage('/assets/mockup_result.png');
    setChallengeImages([{ url: '/assets/mockup_challenge.png', public_id: '' }]);
    setSolutionImages([{ url: '/assets/mockup_solution.png', public_id: '' }]);
    setResultImages([{ url: '/assets/mockup_result.png', public_id: '' }]);
    setGallery('');
    setChallenge('A comprehensive overhaul focused on performance, accessibility, and modern glassmorphism aesthetic.');
    setSolution('Designed progressive disclosure cards, clean drawer navigation, and responsive touch interaction models.');
    setResults('Achieved 98+ Google Lighthouse performance score and 30% increase in user engagement.');
    setProcess('');
    setHasCaseStudy(true);
    setIsFeatured(true);
    setShowOnHome(true);
    setEnabled(true);
    setOrder(0);
    setCurrentId(null);
  };

  const handleEdit = (proj) => {
    setCurrentId(proj._id);
    setName(proj.name);
    setSlug(proj.slug);
    setCategory(proj.category);
    setYear(proj.year);
    setClient(proj.client || 'Faheem');
    setStatus(proj.status || 'Completed');
    setTechnologies(proj.technologies ? proj.technologies.join(', ') : '');
    setShortDesc(proj.shortDesc);
    setLongDesc(proj.longDesc || '');
    setLiveUrl(proj.liveUrl || '');
    setCaseStudyUrl(proj.caseStudyUrl || '');
    setGithubUrl(proj.githubUrl || '');
    setCoverImage(proj.coverImage || '/assets/project_eco_shades.jpg');
    setThumbnailImage(proj.thumbnailImage || proj.coverImage || '/assets/project_eco_shades.jpg');
    setBannerImage(proj.bannerImage || proj.coverImage || '/assets/project_eco_shades.jpg');
    
    const defChallenge = proj.challengeImage || '/assets/mockup_challenge.png';
    const defSolution = proj.solutionImage || '/assets/mockup_solution.png';
    const defResult = proj.resultImage || '/assets/mockup_result.png';

    setChallengeImage(defChallenge);
    setSolutionImage(defSolution);
    setResultImage(defResult);

    const formatGalleryArr = (arr, singleFallback, defaultAsset) => {
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map(item => typeof item === 'string' ? { url: item, public_id: '' } : { url: item.url || '', public_id: item.public_id || '' });
      }
      if (singleFallback) return [{ url: singleFallback, public_id: '' }];
      if (defaultAsset) return [{ url: defaultAsset, public_id: '' }];
      return [];
    };

    setChallengeImages(formatGalleryArr(proj.challengeImages, proj.challengeImage, '/assets/mockup_challenge.png'));
    setSolutionImages(formatGalleryArr(proj.solutionImages, proj.solutionImage, '/assets/mockup_solution.png'));
    setResultImages(formatGalleryArr(proj.resultImages, proj.resultImage, '/assets/mockup_result.png'));

    setGallery(proj.gallery ? proj.gallery.join(', ') : '');
    setChallenge(proj.challenge || 'A comprehensive overhaul focused on performance, accessibility, and modern glassmorphism aesthetic.');
    setSolution(proj.solution || 'Designed progressive disclosure cards, clean drawer navigation, and responsive touch interaction models.');
    setResults(proj.results || 'Achieved 98+ Google Lighthouse performance score and 30% increase in user engagement.');
    setProcess(proj.process || '');
    setHasCaseStudy(proj.hasCaseStudy !== false);
    setIsFeatured(!!proj.isFeatured);
    setShowOnHome(!!proj.showOnHome);
    setEnabled(!!proj.enabled);
    setOrder(proj.order || 0);
    setIsEditing(true);
  };

  const handleSaveSectionIndependent = async (sectionName, updatedImages) => {
    if (!currentId) return;
    setSavingSection(sectionName);
    try {
      const payload = { [sectionName]: updatedImages };
      await projectsCrud.update(currentId, payload);
    } catch (err) {
      console.error(`Failed to save section ${sectionName}:`, err);
    } finally {
      setSavingSection('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedTechs = technologies.split(',').map(t => t.trim()).filter(Boolean);
    const formattedGallery = gallery.split(',').map(g => g.trim()).filter(Boolean);

    const projectData = {
      name, slug, category, year, client, status, shortDesc, longDesc,
      liveUrl, caseStudyUrl, githubUrl, coverImage, thumbnailImage, bannerImage,
      challenge, challengeImage, solution, solutionImage, results, resultImage,
      challengeImages, solutionImages, resultImages,
      process, hasCaseStudy, isFeatured, showOnHome, enabled, order,
      technologies: formattedTechs,
      gallery: formattedGallery
    };

    let res;
    if (currentId) {
      res = await projectsCrud.update(currentId, projectData);
    } else {
      res = await projectsCrud.create(projectData);
    }

    if (res.success) {
      resetForm();
      setIsEditing(false);
    } else {
      alert(res.message || 'Failed to save project. Make sure slug is unique.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you absolutely sure you want to delete this project?')) {
      const res = await projectsCrud.delete(id);
      if (!res.success) alert('Failed to delete project.');
    }
  };

  const [editSubTab, setEditSubTab] = useState('info'); // 'info' | 'caseStudy'

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Project Management</h1>
          <p className="admin-header-subtitle">Add, edit, or delete items in your portfolio grid</p>
        </div>
        {!isEditing && (
          <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setIsEditing(true); }}>
            <FiPlus /> New Project
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="admin-panel">
          <div className="admin-panel-title" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <span>{currentId ? `Editing: ${name || 'Project'}` : 'Create New Project'}</span>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {currentId && (
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                  <button
                    type="button"
                    className={`admin-btn ${editSubTab === 'info' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => setEditSubTab('info')}
                  >
                    📝 Basic Info
                  </button>
                  <button
                    type="button"
                    className={`admin-btn ${editSubTab === 'caseStudy' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => setEditSubTab('caseStudy')}
                  >
                    ⚡ Case Study Images & Links
                  </button>
                </div>
              )}

              <button className="admin-btn admin-btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setIsEditing(false)}>
                <FiX /> Exit Editor
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Project Name</label>
                <input type="text" className="admin-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Slug (URL friendly path)</label>
                <input type="text" className="admin-input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. creative-agency" required />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Category</label>
                <input type="text" className="admin-input" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. UX Design" required />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Year</label>
                <input type="text" className="admin-input" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2026" required />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Client</label>
                <input type="text" className="admin-input" value={client} onChange={e => setClient(e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Status</label>
                <select className="admin-select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Concept">Concept</option>
                </select>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Technologies (comma separated)</label>
              <input type="text" className="admin-input" value={technologies} onChange={e => setTechnologies(e.target.value)} placeholder="React, Node, Figma" />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Short Description</label>
              <input type="text" className="admin-input" value={shortDesc} onChange={e => setShortDesc(e.target.value)} required />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Long Description (MarkDown or Text)</label>
              <textarea className="admin-textarea" value={longDesc} onChange={e => setLongDesc(e.target.value)}></textarea>
            </div>

            {/* Links */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Live Link URL</label>
                <input type="text" className="admin-input" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">GitHub URL</label>
                <input type="text" className="admin-input" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
              </div>
            </div>

            {/* Image URLs & Direct Upload Options */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Cover Image URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={coverImage} 
                    onChange={e => setCoverImage(e.target.value)} 
                    placeholder="Enter image URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, setCoverImage)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {coverImage && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={coverImage} 
                      alt="Cover Preview" 
                      style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', padding: '4px' }} 
                    />
                  </div>
                )}
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Thumbnail Image URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={thumbnailImage} 
                    onChange={e => setThumbnailImage(e.target.value)} 
                    placeholder="Enter thumbnail URL or upload file"
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, setThumbnailImage)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {thumbnailImage && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={thumbnailImage} 
                      alt="Thumbnail Preview" 
                      style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', padding: '4px' }} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Case Study Banner Image URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={bannerImage} 
                    onChange={e => setBannerImage(e.target.value)} 
                    placeholder="Enter banner URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, setBannerImage)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {bannerImage && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={bannerImage} 
                      alt="Banner Preview" 
                      style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', padding: '4px' }} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Gallery Images (comma separated URLs)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="admin-input" 
                  value={gallery} 
                  onChange={e => setGallery(e.target.value)} 
                  placeholder="URL list e.g. /uploads/image1.jpg, /uploads/image2.png" 
                />
                <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                  Upload & Append
                  <input 
                    type="file" 
                    onChange={handleGalleryUpload} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
            </div>

            {/* Case Study Details */}
            <div className="admin-form-group" style={{ marginTop: '24px', borderTop: '1px solid var(--admin-border)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Case Study Content</h3>
              
              <div className="admin-form-group">
                <label className="admin-label">The Challenge (Text)</label>
                <textarea className="admin-textarea" value={challenge} onChange={e => setChallenge(e.target.value)}></textarea>
              </div>
              <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                <label className="admin-label">The Challenge Mockup Image URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={challengeImage} 
                    onChange={e => setChallengeImage(e.target.value)} 
                    placeholder="Enter challenge mockup image URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, setChallengeImage)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {challengeImage && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={challengeImage} 
                      alt="Challenge Preview" 
                      style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', padding: '4px' }} 
                    />
                  </div>
                )}
              </div>

              <div className="admin-form-group" style={{ marginTop: '20px', borderTop: '1px dotted var(--admin-border)', paddingTop: '15px' }}>
                <label className="admin-label">The Solution (Text)</label>
                <textarea className="admin-textarea" value={solution} onChange={e => setSolution(e.target.value)}></textarea>
              </div>
              <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                <label className="admin-label">The Solution Mockup Image URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={solutionImage} 
                    onChange={e => setSolutionImage(e.target.value)} 
                    placeholder="Enter solution mockup image URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, setSolutionImage)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {solutionImage && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={solutionImage} 
                      alt="Solution Preview" 
                      style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', padding: '4px' }} 
                    />
                  </div>
                )}
              </div>

              <div className="admin-form-group" style={{ marginTop: '20px', borderTop: '1px dotted var(--admin-border)', paddingTop: '15px' }}>
                <label className="admin-label">The Result (Text)</label>
                <textarea className="admin-textarea" value={results} onChange={e => setResults(e.target.value)} placeholder="Describe the result of the project..."></textarea>
              </div>
              <div className="admin-form-group" style={{ marginBottom: '10px' }}>
                <label className="admin-label">The Result Mockup Image URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={resultImage} 
                    onChange={e => setResultImage(e.target.value)} 
                    placeholder="Enter result mockup image URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, setResultImage)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                {resultImage && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={resultImage} 
                      alt="Result Preview" 
                      style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', padding: '4px' }} 
                    />
                  </div>
                )}
              </div>

              <div className="admin-form-group" style={{ marginTop: '20px', borderTop: '1px dotted var(--admin-border)', paddingTop: '15px' }}>
                <label className="admin-label">The Process (Text)</label>
                <textarea className="admin-textarea" value={process} onChange={e => setProcess(e.target.value)}></textarea>
              </div>
            </div>

            {/* Ordering and Settings */}
            <div className="admin-form-row" style={{ marginTop: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-label">Display Order</label>
                <input type="number" className="admin-input" value={order} onChange={e => setOrder(parseInt(e.target.value) || 0)} />
              </div>
              <div className="admin-form-group" style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '100%', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: hasCaseStudy ? '#10B981' : '#EF4444' }}>
                  <input type="checkbox" checked={hasCaseStudy} onChange={e => setHasCaseStudy(e.target.checked)} />
                  📖 Case Study Page ({hasCaseStudy ? 'ON' : 'OFF'})
                </label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                  Featured Project
                </label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={showOnHome} onChange={e => setShowOnHome(e.target.checked)} />
                  Show on Homepage
                </label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                  Enabled
                </label>
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '20px' }}>
              Save Project Info
            </button>
          </form>

          {/* Case Study CMS Image & Link Manager Cards */}
          {currentId && (
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid var(--admin-border)' }}>
              <CaseStudyCMSManager 
                project={projects.find(p => p._id === currentId || p.slug === currentId) || { _id: currentId }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="admin-panel">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Project Name</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj._id}>
                    <td style={{ fontWeight: '600' }}>{proj.order}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {proj.coverImage && (
                          <img src={proj.coverImage} alt={proj.name} style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                        <span style={{ fontWeight: '500' }}>{proj.name}</span>
                      </div>
                    </td>
                    <td>{proj.category}</td>
                    <td>{proj.year}</td>
                    <td>{proj.isFeatured ? '⭐ Yes' : 'No'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: proj.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: proj.enabled ? 'var(--admin-success)' : 'var(--admin-error)'
                      }}>
                        {proj.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="admin-btn admin-btn-secondary" style={{ padding: '8px' }} onClick={() => handleEdit(proj)}>
                          <FiEdit2 size={14} />
                        </button>
                        <button className="admin-btn admin-btn-danger" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => handleDelete(proj._id)}>
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
