import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  FiUploadCloud, FiTrash2, FiSave, FiEye, 
  FiCheckCircle, FiLink, FiCheck, FiX, FiPlus
} from 'react-icons/fi';

/**
 * Ultra-Simple Clean Image Uploader Card for Case Study CMS
 */
function SimpleImageCard({ title, subtitle, imageSrc, onSaveImage, onRemoveImage }) {
  const { uploadCaseStudyFile } = useAdmin();
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(imageSrc || '');

  useEffect(() => {
    setUrlInput(imageSrc || '');
  }, [imageSrc]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadCaseStudyFile(file);
      if (res.success && res.url) {
        onSaveImage(res.url);
        setUrlInput(res.url);
      } else {
        alert(res.message || 'Upload failed');
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    onSaveImage(urlInput);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #EAEAEA', marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111827' }}>{title}</h4>
          {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#6B7280' }}>{subtitle}</p>}
        </div>
        {imageSrc && (
          <button 
            type="button" 
            onClick={onRemoveImage} 
            style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <FiTrash2 size={13} /> Remove
          </button>
        )}
      </div>

      {imageSrc ? (
        <div style={{ position: 'relative', width: '100%', maxHeight: '180px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <img src={imageSrc} alt={title} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{ border: '2px dashed #D1D5DB', borderRadius: '10px', padding: '16px', textAlign: 'center', background: '#FAFAFA' }}>
          <FiUploadCloud size={24} style={{ color: '#9CA3AF', marginBottom: '4px' }} />
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4B5563', fontWeight: '500' }}>
            {isUploading ? 'Uploading to Cloudinary...' : 'Upload Image or paste URL below'}
          </p>
          <label style={{ display: 'inline-block', background: '#111827', color: '#FFFFFF', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            Choose File
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*" disabled={isUploading} />
          </label>
        </div>
      )}

      {/* Direct URL Paste Bar */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <input 
          type="text" 
          value={urlInput} 
          onChange={e => setUrlInput(e.target.value)} 
          placeholder="Or paste direct image URL (https://...)" 
          style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px', outline: 'none' }} 
        />
        <button 
          type="button" 
          onClick={handleApplyUrl} 
          style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', padding: '7px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
        >
          Set URL
        </button>
      </div>
    </div>
  );
}

/**
 * Ultra-Simple Clean Case Study Admin Manager
 */
export default function CaseStudyCMSManager({ project, onSaveComplete }) {
  const { updateCaseStudy } = useAdmin();
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'images'
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Clean Case Study Form State
  const [hasCaseStudy, setHasCaseStudy] = useState(project?.hasCaseStudy !== false);
  const [projectName, setProjectName] = useState(project?.name || '');
  const [shortDesc, setShortDesc] = useState(project?.shortDesc || project?.overviewConfig?.intro || '');
  const [liveUrl, setLiveUrl] = useState(project?.links?.liveProject || project?.liveUrl || '');
  
  // 4 Meta Grid Fields
  const [category, setCategory] = useState(project?.category || 'Product Design');
  const [role, setRole] = useState(project?.infoConfig?.role || 'UI/UX Design');
  const [client, setClient] = useState(project?.client || 'Digital Client');
  const [year, setYear] = useState(project?.year || '2026');

  // Text Sections
  const [challengeText, setChallengeText] = useState(project?.challenge || project?.challengeIntro || '');
  const [resultsText, setResultsText] = useState(project?.results || project?.conclusion || '');

  // 3 Separate Card Slider Image Arrays (up to 4 images each)
  const extractList = (primary, secondary, arr) => {
    const list = [];
    if (primary && typeof primary === 'string' && primary.trim()) list.push(primary);
    if (secondary && typeof secondary === 'string' && secondary.trim()) list.push(secondary);
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (typeof item === 'string' && item.trim()) list.push(item);
        if (typeof item === 'object' && item.url) list.push(item.url);
      });
    }
    while (list.length < 4) list.push('');
    return list.slice(0, 4);
  };

  const [card1Images, setCard1Images] = useState(extractList(project?.heroImage || project?.bannerImage, null, project?.heroImages));
  const [card2Images, setCard2Images] = useState(extractList(project?.solutionImage, project?.challengeImage, project?.solutionImages || project?.challengeImages));
  const [card3Images, setCard3Images] = useState(extractList(project?.conclusionImage || project?.resultImage, null, project?.resultImages || project?.conclusionImages));

  useEffect(() => {
    if (project) {
      setHasCaseStudy(project.hasCaseStudy !== false);
      setProjectName(project.name || '');
      setShortDesc(project.shortDesc || project.overviewConfig?.intro || '');
      setLiveUrl(project.links?.liveProject || project.liveUrl || '');
      setCategory(project.category || 'Product Design');
      setRole(project.infoConfig?.role || 'UI/UX Design');
      setClient(project.client || 'Digital Client');
      setYear(project.year || '2026');
      setChallengeText(project.challenge || project.challengeIntro || '');
      setResultsText(project.results || project.conclusion || '');

      setCard1Images(extractList(project.heroImage || project.bannerImage, null, project.heroImages));
      setCard2Images(extractList(project.solutionImage, project.challengeImage, project.solutionImages || project.challengeImages));
      setCard3Images(extractList(project.conclusionImage || project.resultImage, null, project.resultImages || project.conclusionImages));
    }
  }, [project]);

  const updateCardImage = (cardIndex, slotIndex, url) => {
    if (cardIndex === 1) {
      const copy = [...card1Images];
      copy[slotIndex] = url;
      setCard1Images(copy);
    } else if (cardIndex === 2) {
      const copy = [...card2Images];
      copy[slotIndex] = url;
      setCard2Images(copy);
    } else if (cardIndex === 3) {
      const copy = [...card3Images];
      copy[slotIndex] = url;
      setCard3Images(copy);
    }
  };

  const handleSave = async () => {
    if (!project?._id && !project?.slug) return;
    setIsSaving(true);

    const validCard1 = card1Images.filter(Boolean);
    const validCard2 = card2Images.filter(Boolean);
    const validCard3 = card3Images.filter(Boolean);

    const payload = {
      name: projectName,
      shortDesc,
      hasCaseStudy,
      liveUrl,
      category,
      client,
      year,
      links: { ...(project?.links || {}), liveProject: liveUrl },
      infoConfig: { ...(project?.infoConfig || {}), role, timeline: `${year}` },
      challenge: challengeText,
      challengeIntro: challengeText,
      results: resultsText,
      conclusion: resultsText,

      // Card 1 Slider Images
      heroImages: validCard1,
      heroImage: validCard1[0] || '',
      bannerImage: validCard1[0] || '',

      // Card 2 Slider Images
      solutionImages: validCard2,
      challengeImages: validCard2,
      solutionImage: validCard2[0] || '',
      challengeImage: validCard2[0] || '',

      // Card 3 Slider Images
      resultImages: validCard3,
      conclusionImages: validCard3,
      conclusionImage: validCard3[0] || '',
      resultImage: validCard3[0] || ''
    };

    const res = await updateCaseStudy(project._id || project.slug, payload);
    setIsSaving(false);

    if (res.success) {
      setToastMessage('Case Study 3-Card Sliders saved live to MongoDB!');
      setTimeout(() => setToastMessage(''), 3000);
      if (onSaveComplete) onSaveComplete(res.project);
    } else {
      alert(res.message || 'Failed to save changes.');
    }
  };

  const projectSlug = project?.slug || project?._id;

  return (
    <div style={{ background: '#F9FAFB', borderRadius: '24px', padding: '28px', border: '1px solid #E5E7EB', marginTop: '24px' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#10B981', color: '#FFFFFF', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }}>
          <FiCheckCircle size={18} /> {toastMessage}
        </div>
      )}

      {/* Top Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' }}>
              Case Study Manager: <span style={{ color: '#6D28D9' }}>{projectName || project?.name}</span>
            </h2>
            <button
              type="button"
              onClick={() => setHasCaseStudy(!hasCaseStudy)}
              style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer',
                background: hasCaseStudy ? '#ECFDF5' : '#FEF2F2',
                color: hasCaseStudy ? '#059669' : '#DC2626'
              }}
            >
              {hasCaseStudy ? '✓ Case Study: ON' : '✕ Case Study: OFF'}
            </button>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
            Ultra-simple live manager for 3 Interactive 4-Image Card Sliders & text content.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href={`/projects/${projectSlug}`}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '10px 18px', borderRadius: '10px', background: '#F3F4F6', color: '#374151', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FiEye size={16} /> Live Preview ↗
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '10px 24px', borderRadius: '10px', background: '#10B981', color: '#FFFFFF', border: 'none', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
          >
            <FiSave size={16} /> {isSaving ? 'Saving Changes...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Simplified Clean Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
            background: activeTab === 'content' ? '#111827' : '#FFFFFF',
            color: activeTab === 'content' ? '#FFFFFF' : '#374151',
            boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
          }}
        >
          📝 Case Study Content & Text
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
            background: activeTab === 'images' ? '#111827' : '#FFFFFF',
            color: activeTab === 'images' ? '#FFFFFF' : '#374151',
            boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
          }}
        >
          📸 3-Card Interactive Sliders (4 Images Each)
        </button>
      </div>

      {/* ── TAB 1: CONTENT & TEXT ── */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Overview & Links */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#111827' }}>
              📌 Overview & Metadata
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Project Name</label>
                <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Project Short Description (Top Paragraph)</label>
                <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={3} placeholder="A modern digital product designed to deliver..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Visit Website Link (Live URL for Glossy Purple Button)</label>
                <input type="text" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://yourproject.vercel.app" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* 4 Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>Category</label>
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>Services / Role</label>
                  <input type="text" value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>Client</label>
                  <input type="text" value={client} onChange={e => setClient(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '4px' }}>Date / Year</label>
                  <input type="text" value={year} onChange={e => setYear(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: The Challenge Section */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#111827' }}>
              🎯 THE CHALLENGE Section Text
            </h3>
            <textarea 
              value={challengeText} 
              onChange={e => setChallengeText(e.target.value)} 
              rows={4} 
              placeholder="Describe the challenge or problem statement..." 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>

          {/* Card 3: Final Outcome Text */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#111827' }}>
              🏆 FINAL OUTCOME Section Text
            </h3>
            <textarea 
              value={resultsText} 
              onChange={e => setResultsText(e.target.value)} 
              rows={4} 
              placeholder="Describe the final outcome and results achieved..." 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>

        </div>
      )}

      {/* ── TAB 2: SHOWCASE MOCKUP IMAGES (3 Card Sliders - 4 Images Each) ── */}
      {activeTab === 'images' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '16px', borderRadius: '12px', color: '#1E40AF', fontSize: '13px', lineHeight: '1.5' }}>
            🚀 <strong>3 Interactive Card Sliders Enabled!</strong> You can now add up to 4 images per card section (Card 1 Top Showcase, Card 2 Middle Showcase, Card 3 Bottom Outcome). Each section becomes an interactive slider with navigation arrows & indicator dots on the live site!
          </div>

          {/* 1. CARD 1 SLIDER GROUP (Top Main Cover) */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
              🎨 CARD 1 SLIDER: Top Main Cover Showcase (Up to 4 Images)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[0, 1, 2, 3].map((slotIdx) => (
                <SimpleImageCard 
                  key={slotIdx}
                  title={`Slide ${slotIdx + 1}`} 
                  subtitle={`Card 1 Slide Image ${slotIdx + 1}`}
                  imageSrc={card1Images[slotIdx]}
                  onSaveImage={(url) => updateCardImage(1, slotIdx, url)}
                  onRemoveImage={() => updateCardImage(1, slotIdx, '')}
                />
              ))}
            </div>
          </div>

          {/* 2. CARD 2 SLIDER GROUP (Middle Featured Showcase) */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
              🎯 CARD 2 SLIDER: Middle Featured Showcase (Up to 4 Images)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[0, 1, 2, 3].map((slotIdx) => (
                <SimpleImageCard 
                  key={slotIdx}
                  title={`Slide ${slotIdx + 1}`} 
                  subtitle={`Card 2 Slide Image ${slotIdx + 1}`}
                  imageSrc={card2Images[slotIdx]}
                  onSaveImage={(url) => updateCardImage(2, slotIdx, url)}
                  onRemoveImage={() => updateCardImage(2, slotIdx, '')}
                />
              ))}
            </div>
          </div>

          {/* 3. CARD 3 SLIDER GROUP (Bottom Outcome Showcase) */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAEAEA' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
              🏆 CARD 3 SLIDER: Bottom Outcome Showcase (Up to 4 Images)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[0, 1, 2, 3].map((slotIdx) => (
                <SimpleImageCard 
                  key={slotIdx}
                  title={`Slide ${slotIdx + 1}`} 
                  subtitle={`Card 3 Slide Image ${slotIdx + 1}`}
                  imageSrc={card3Images[slotIdx]}
                  onSaveImage={(url) => updateCardImage(3, slotIdx, url)}
                  onRemoveImage={() => updateCardImage(3, slotIdx, '')}
                />
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
