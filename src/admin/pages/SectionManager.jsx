import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FiSave, FiPlus, FiTrash2, FiEdit3, FiUpload, FiImage, FiX, FiCheck } from 'react-icons/fi';
import '../Admin.css';

export default function SectionManager() {
  const { 
    siteSettings, updateSettings, 
    services, servicesCrud,
    skills, skillsCrud,
    experiencesCrud,
    faqs, faqsCrud,
    uploadMediaFile,
    media, fetchMedia
  } = useAdmin();

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTargetSetter, setMediaTargetSetter] = useState(null);

  const handleDirectUpload = async (e, formState, setFormStateCallback, fieldName) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    showToast('Uploading image to media storage...', 'info');
    try {
      const res = await uploadMediaFile(file);
      const uploadedUrl = res?.url || res?.fileUrl;
      if (res?.success && uploadedUrl) {
        setFormStateCallback(prev => ({ ...prev, [fieldName]: uploadedUrl }));
        showToast('Image uploaded successfully! Click Save to apply changes.', 'success');
      } else {
        showToast(`Upload failed: ${res?.message || 'Please try again.'}`, 'error');
      }
    } catch (err) {
      showToast(`Upload error: ${err.message || 'Network error'}`, 'error');
    }
  };

  const [activeTab, setActiveTab] = useState('hero');
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Loading States
  const [saving, setSaving] = useState(false);

  // Tab State variables
  const [heroForm, setHeroForm] = useState({ greeting: '', name: '', words: '', title1: '', title2: '', description: '', isAvailable: true, availabilityText: '', heroImage: '', bgImage: '', bgVideo: '' });
  const [navForm, setNavForm] = useState({ logoType: 'text', logoText: 'FAHEEM', logoImage: '', logoHeight: 32, downloadCvBtnText: 'Download CV', downloadCvBtnVisible: true, themeToggleVisible: true, stickyNavbar: true });
  const [aboutForm, setAboutForm] = useState({ title: '', subtitle: '', description: '', experienceYears: 3, aboutImage: '' });
  const [footerForm, setFooterForm] = useState({ logoText: '', copyrightText: '', authorName: 'Faheem', description: '', contactEmail: '', bgImage: '', bgVideo: '', githubUrl: '', linkedinUrl: '', facebookUrl: '', instagramUrl: '', whatsappUrl: '', dribbbleUrl: '', twitterUrl: '', emailTextColor: 'dark', bgBlur: 12, bgBrightness: 100 });
  const [faqForm, setFaqForm] = useState({ title: 'Frequently asked Questions', bgImage: '/assets/faq_bg_blocks.png' });
  const [seoForm, setSeoForm] = useState({ siteTitle: '', metaDescription: '', keywords: '', favicon: '', ogImage: '' });
  const [globalForm, setGlobalForm] = useState({ portfolioName: '', websiteUrl: '', favicon: '', loaderTitle: 'LOADING', loaderText: 'UI / UX DESIGNER', primaryColor: '', secondaryColor: '', accentColor: '', loaderLogo: '', loaderImage: '', loaderImage1: '', loaderImage2: '', loaderImage3: '', loaderImage4: '', loaderImage5: '' });
  const [themeForm, setThemeForm] = useState({ mode: 'system' });
  const [resumeForm, setResumeForm] = useState({ resumeUrl: '', version: '1.0.0', fileName: 'resume.pdf' });
  const [contactForm, setContactForm] = useState({
    heading: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    mapUrl: '',
    emailSubject: 'New Portfolio Contact - {{name}}',
    enableAutoReply: true,
    enableWhatsappButton: true,
    enableForm: true
  });
  const [chatForm, setChatForm] = useState({
    enabled: true,
    headerTitle: 'Faheem',
    headerStatusText: 'Online • Replies in minutes',
    headerBgColor: '#0F8C6E',
    headerTextColor: '#ffffff',
    buttonText: 'Quick Chat',
    buttonBgColor: '#0d0d11',
    buttonTextColor: '#ffffff',
    buttonBorderColor: 'rgba(255, 255, 255, 0.14)',
    buttonIconColor: '#25D366',
    buttonDotColor: '#10B981',
    chatBgColor: '#0b0b0f',
    welcomeBubbleBg: '#1E1F26',
    welcomeMessageLine1: "Hi there! 👋 I'm Faheem, UI/UX Designer & Front-End Developer.",
    welcomeMessageLine2: "How can I help you with your web or mobile project today?",
    fontFamily: 'Plus Jakarta Sans',
    quickAction1Text: '💬 Custom Web / UI Design',
    quickAction1Message: "Hi Faheem, I'd like to discuss a Custom Web / UI Design project.",
    quickAction2Text: '🚀 Hire for a Project',
    quickAction2Message: "Hi Faheem, I'd like to hire you for a project.",
    quickAction3Text: '💰 Pricing & Quotation',
    quickAction3Message: "Hi Faheem, I'd like to ask about pricing and quotations."
  });

  // Initialize forms when siteSettings updates
  useEffect(() => {
    if (siteSettings.hero) setHeroForm({ ...siteSettings.hero, words: siteSettings.hero.words ? siteSettings.hero.words.join(', ') : '' });
    if (siteSettings.navbar) setNavForm({ ...siteSettings.navbar });
    if (siteSettings.about) setAboutForm({ ...siteSettings.about });
    if (siteSettings.footer) setFooterForm(prev => ({ ...prev, ...siteSettings.footer }));
    if (siteSettings.faq) setFaqForm(prev => ({ ...prev, ...siteSettings.faq }));
    if (siteSettings.seo) setSeoForm({ ...siteSettings.seo, keywords: siteSettings.seo.keywords ? siteSettings.seo.keywords.join(', ') : '' });
    if (siteSettings.global) setGlobalForm({ ...siteSettings.global });
    if (siteSettings.theme) setThemeForm({ ...siteSettings.theme });
    if (siteSettings.resume) setResumeForm({ ...siteSettings.resume });
    if (siteSettings.contact) setContactForm({ ...siteSettings.contact });
    if (siteSettings.chat) setChatForm({ ...siteSettings.chat });
  }, [siteSettings]);

  // Load lists exactly once on component mount
  useEffect(() => {
    servicesCrud.getAll();
    skillsCrud.getAll();
    experiencesCrud.getAll();
    faqsCrud.getAll();
  }, []);

  const handleSaveSettings = async (moduleName, data) => {
    setSaving(true);
    let payload = { ...data };
    if (moduleName === 'hero' && typeof data.words === 'string') {
      payload.words = data.words.split(',').map(w => w.trim()).filter(Boolean);
    }
    if (moduleName === 'seo' && typeof data.keywords === 'string') {
      payload.keywords = data.keywords.split(',').map(k => k.trim()).filter(Boolean);
    }

    const res = await updateSettings(moduleName, payload);
    setSaving(false);
    if (res.success) {
      showToast(`${moduleName.toUpperCase()} settings saved successfully!`, 'success');
    } else {
      showToast(`Error saving configurations: ${res.message}`, 'error');
    }
  };

  // Mini CRUD implementations for sub-tables (Services, FAQs, Skills)
  const [newService, setNewService] = useState({ 
    title: '', 
    description: '', 
    iconName: 'FiCpu', 
    color: '#8B5CF6', 
    iconType: 'iconName', 
    iconSvg: '', 
    order: 0,
    imageUrl: '',
    bgColor: '#e7eae0',
    skills: ''
  });
  const [editingService, setEditingService] = useState(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', order: 0 });
  const [editingFaq, setEditingFaq] = useState(null);
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Design', percentage: 80, order: 0 });
  
  const handleEditServiceStart = (service) => {
    setEditingService({
      ...service,
      imageUrl: service.imageUrl || '',
      bgColor: service.bgColor || '#e7eae0',
      skills: Array.isArray(service.skills) ? service.skills.join(', ') : (service.skills || '')
    });
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    const payload = {
      ...newService,
      skills: typeof newService.skills === 'string' ? newService.skills.split(',').map(s => s.trim()).filter(Boolean) : []
    };
    await servicesCrud.create(payload);
    setNewService({ 
      title: '', 
      description: '', 
      iconName: 'FiCpu', 
      color: '#8B5CF6', 
      iconType: 'iconName', 
      iconSvg: '', 
      order: 0,
      imageUrl: '',
      bgColor: '#e7eae0',
      skills: ''
    });
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    const payload = {
      title: editingService.title,
      description: editingService.description,
      iconName: editingService.iconName,
      color: editingService.color || '#8B5CF6',
      iconType: editingService.iconType || 'iconName',
      iconSvg: editingService.iconSvg || '',
      order: editingService.order || 0,
      imageUrl: editingService.imageUrl || '',
      bgColor: editingService.bgColor || '#e7eae0',
      skills: typeof editingService.skills === 'string' ? editingService.skills.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(editingService.skills) ? editingService.skills : [])
    };
    const res = await servicesCrud.update(editingService._id, payload);
    if (res.success) {
      setEditingService(null);
    } else {
      alert('Failed to update Service.');
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    const res = await faqsCrud.create(newFaq);
    if (res.success) {
      setNewFaq({ question: '', answer: '', order: 0 });
      showToast('FAQ item added successfully!', 'success');
    } else {
      showToast('Failed to add FAQ item.', 'error');
    }
  };

  const handleUpdateFaq = async (e) => {
    e.preventDefault();
    if (!editingFaq) return;
    const res = await faqsCrud.update(editingFaq._id, {
      question: editingFaq.question,
      answer: editingFaq.answer,
      order: editingFaq.order || 0
    });
    if (res.success) {
      setEditingFaq(null);
      showToast('FAQ item updated successfully!', 'success');
    } else {
      showToast('Failed to update FAQ item.', 'error');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    await skillsCrud.create(newSkill);
    setNewSkill({ name: '', category: 'Design', percentage: 80, order: 0 });
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Page Content Editor</h1>
          <p className="admin-header-subtitle">Easily update your website text grids, navbar actions, SEO settings, and lists</p>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {['hero', 'navbar', 'about', 'services', 'skills', 'faqs', 'contact', 'footer', 'seo', 'global', 'theme', 'chat'].map(tab => (
          <button 
            key={tab} 
            className={`admin-btn ${activeTab === tab ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'theme' ? 'THEME CONTROLLER' : tab === 'chat' ? '💬 CHAT WIDGET' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Render panel */}
      <div className="admin-panel">
        
        {/* HERO TAB */}
        {activeTab === 'hero' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('hero', heroForm); }}>
            <h3 className="admin-panel-title">Hero Section Settings</h3>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Greeting Prefix</label>
                <input type="text" className="admin-input" value={heroForm.greeting} onChange={e => setHeroForm({ ...heroForm, greeting: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Primary Name</label>
                <input type="text" className="admin-input" value={heroForm.name} onChange={e => setHeroForm({ ...heroForm, name: e.target.value })} />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Typing Words Carousel (comma separated)</label>
              <input type="text" className="admin-input" value={heroForm.words} onChange={e => setHeroForm({ ...heroForm, words: e.target.value })} />
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Heading Row 1</label>
                <input type="text" className="admin-input" value={heroForm.title1} onChange={e => setHeroForm({ ...heroForm, title1: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Heading Row 2</label>
                <input type="text" className="admin-input" value={heroForm.title2} onChange={e => setHeroForm({ ...heroForm, title2: e.target.value })} />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Description Text</label>
              <textarea className="admin-textarea" value={heroForm.description} onChange={e => setHeroForm({ ...heroForm, description: e.target.value })}></textarea>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Hero Image URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={heroForm.heroImage || ''} 
                    onChange={e => setHeroForm({ ...heroForm, heroImage: e.target.value })} 
                    placeholder="Enter image URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, heroForm, setHeroForm, 'heroImage')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Background Video URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={heroForm.bgVideo || ''} 
                    onChange={e => setHeroForm({ ...heroForm, bgVideo: e.target.value })} 
                    placeholder="Enter video URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, heroForm, setHeroForm, 'bgVideo')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Availability Text</label>
                <input type="text" className="admin-input" value={heroForm.availabilityText} onChange={e => setHeroForm({ ...heroForm, availabilityText: e.target.value })} />
              </div>
              <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px', marginTop: '20px' }}>
                  <input type="checkbox" checked={heroForm.isAvailable} onChange={e => setHeroForm({ ...heroForm, isAvailable: e.target.checked })} />
                  Show Availability Badge
                </label>
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              <FiSave /> Save Hero Settings
            </button>
          </form>
        )}

        {/* NAVBAR TAB */}
        {activeTab === 'navbar' && (
          <>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('navbar', navForm); }}>
              <h3 className="admin-panel-title">Navbar Configuration & Logo Manager</h3>
              
              {/* Brand Logo Type & Settings */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎨 Brand Logo Mode & Appearance
                </h4>

                <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                  <label className="admin-label">Logo Display Mode</label>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                      <input 
                        type="radio" 
                        name="logoType" 
                        value="text" 
                        checked={(navForm.logoType || 'text') === 'text'} 
                        onChange={() => setNavForm({ ...navForm, logoType: 'text' })} 
                      />
                      🔤 Text Logo (e.g. FAHEEM)
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                      <input 
                        type="radio" 
                        name="logoType" 
                        value="image" 
                        checked={navForm.logoType === 'image'} 
                        onChange={() => setNavForm({ ...navForm, logoType: 'image' })} 
                      />
                      🖼️ Image Logo (Custom PNG / SVG / WEBP)
                    </label>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Logo Text</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={navForm.logoText || 'FAHEEM'} 
                      onChange={e => setNavForm({ ...navForm, logoText: e.target.value })} 
                      placeholder="e.g. FAHEEM"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Image Logo Height: {navForm.logoHeight || 32}px</label>
                    <input 
                      type="range" 
                      min="20" 
                      max="60" 
                      value={navForm.logoHeight || 32} 
                      onChange={e => setNavForm({ ...navForm, logoHeight: parseInt(e.target.value) || 32 })} 
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-label">Image Logo File / URL</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={navForm.logoImage || ''} 
                      onChange={e => setNavForm({ ...navForm, logoImage: e.target.value })} 
                      placeholder="Enter logo image URL or upload file" 
                    />
                    <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleDirectUpload(e, navForm, setNavForm, 'logoImage')} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                  {navForm.logoImage && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '10px', width: 'fit-content' }}>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Active Logo Preview:</span>
                      <img src={navForm.logoImage} alt="Logo Preview" style={{ height: `${navForm.logoHeight || 32}px`, width: 'auto', objectFit: 'contain' }} />
                      <button 
                        type="button" 
                        onClick={() => setNavForm({ ...navForm, logoImage: '' })}
                        style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Button & Navbar Controls */}
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">CV Button Text</label>
                  <input type="text" className="admin-input" value={navForm.downloadCvBtnText} onChange={e => setNavForm({ ...navForm, downloadCvBtnText: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '30px', margin: '24px 0' }}>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={navForm.downloadCvBtnVisible} onChange={e => setNavForm({ ...navForm, downloadCvBtnVisible: e.target.checked })} />
                  Show CV Download Button
                </label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={navForm.themeToggleVisible} onChange={e => setNavForm({ ...navForm, themeToggleVisible: e.target.checked })} />
                  Show Theme Toggle Button
                </label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={navForm.stickyNavbar} onChange={e => setNavForm({ ...navForm, stickyNavbar: e.target.checked })} />
                  Enable Sticky Navbar
                </label>
              </div>

              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ marginBottom: '24px' }}>
                <FiSave /> Save Navbar Settings
              </button>
            </form>

            {/* Nested CV/Resume File Uploader Section */}
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--admin-border)', paddingTop: '24px' }}>
              <h3 className="admin-panel-title">Resume / CV Document Uploader</h3>
              <div className="admin-form-group">
                <label className="admin-label">CV File URL (PDF / DOCX)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={resumeForm.resumeUrl || ''} 
                    onChange={e => setResumeForm({ ...resumeForm, resumeUrl: e.target.value })} 
                    placeholder="Enter CV file URL or upload PDF directly" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload PDF
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, resumeForm, setResumeForm, 'resumeUrl')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              </div>
              <button 
                type="button" 
                className="admin-btn admin-btn-primary" 
                onClick={() => handleSaveSettings('resume', resumeForm)}
                disabled={saving}
              >
                <FiSave /> Save CV Document Settings
              </button>
            </div>
          </>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('about', aboutForm); }}>
            <h3 className="admin-panel-title">About Section Settings</h3>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Section Heading</label>
                <input type="text" className="admin-input" value={aboutForm.title} onChange={e => setAboutForm({ ...aboutForm, title: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Section Subtitle</label>
                <input type="text" className="admin-input" value={aboutForm.subtitle} onChange={e => setAboutForm({ ...aboutForm, subtitle: e.target.value })} />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Years of Experience</label>
                <input type="number" className="admin-input" value={aboutForm.experienceYears} onChange={e => setAboutForm({ ...aboutForm, experienceYears: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">About Image URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={aboutForm.aboutImage || ''} 
                    onChange={e => setAboutForm({ ...aboutForm, aboutImage: e.target.value })} 
                    placeholder="Enter image URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, aboutForm, setAboutForm, 'aboutImage')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">About Detail Summary Description</label>
              <textarea className="admin-textarea" value={aboutForm.description} onChange={e => setAboutForm({ ...aboutForm, description: e.target.value })}></textarea>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              <FiSave /> Save About Settings
            </button>
          </form>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div>
            <h3 className="admin-panel-title">Services & Assistance CRUD</h3>
            
            {/* Create / Edit Service */}
            {editingService ? (
              <form onSubmit={handleUpdateService} style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid var(--admin-primary)', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiEdit3 /> Edit Service Item
                </h4>
                
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Service Title</label>
                    <input type="text" className="admin-input" value={editingService.title} onChange={e => setEditingService({ ...editingService, title: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Display Order</label>
                    <input type="number" className="admin-input" value={editingService.order || 0} onChange={e => setEditingService({ ...editingService, order: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Card Accent Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" className="admin-input" style={{ width: '40px', padding: '2px', height: '40px', cursor: 'pointer' }} value={editingService.color || '#8B5CF6'} onChange={e => setEditingService({ ...editingService, color: e.target.value })} />
                      <input type="text" className="admin-input" value={editingService.color || '#8B5CF6'} onChange={e => setEditingService({ ...editingService, color: e.target.value })} placeholder="#8B5CF6" />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Icon Source Type</label>
                    <select className="admin-select" value={editingService.iconType || 'iconName'} onChange={e => setEditingService({ ...editingService, iconType: e.target.value })}>
                      <option value="iconName">React Icon Name (FiPenTool, etc.)</option>
                      <option value="svgCode">Custom SVG Code</option>
                    </select>
                  </div>
                </div>

                {editingService.iconType === 'svgCode' ? (
                  <div className="admin-form-group">
                    <label className="admin-label">Custom SVG Code</label>
                    <textarea className="admin-textarea" value={editingService.iconSvg || ''} onChange={e => setEditingService({ ...editingService, iconSvg: e.target.value })} placeholder="<svg ...>...</svg>" style={{ fontFamily: 'monospace', fontSize: '12px' }} required></textarea>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '11px', marginTop: '4px' }}>
                      Tip: Use <strong>stroke="currentColor"</strong> or <strong>fill="currentColor"</strong> in your SVG elements so they automatically transition and match your custom card color!
                    </p>
                  </div>
                ) : (
                  <div className="admin-form-group">
                    <label className="admin-label">React Icon Name (from react-icons/fi)</label>
                    <input type="text" className="admin-input" value={editingService.iconName || ''} onChange={e => setEditingService({ ...editingService, iconName: e.target.value })} placeholder="FiPenTool, FiMonitor, FiCode, FiSmartphone..." required />
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-label">Description</label>
                  <textarea className="admin-textarea" value={editingService.description} onChange={e => setEditingService({ ...editingService, description: e.target.value })} required></textarea>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Card Background Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" className="admin-input" style={{ width: '40px', padding: '2px', height: '40px', cursor: 'pointer' }} value={editingService.bgColor || '#e7eae0'} onChange={e => setEditingService({ ...editingService, bgColor: e.target.value })} />
                      <input type="text" className="admin-input" value={editingService.bgColor || '#e7eae0'} onChange={e => setEditingService({ ...editingService, bgColor: e.target.value })} placeholder="#e7eae0" />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Skills (comma-separated)</label>
                    <input type="text" className="admin-input" value={editingService.skills || ''} onChange={e => setEditingService({ ...editingService, skills: e.target.value })} placeholder="Research, Wireframes, User Testing" />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Service Card Image URL</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={editingService.imageUrl || ''} 
                      onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })} 
                      placeholder="Enter image URL or upload file" 
                    />
                    <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                      Upload Image
                      <input 
                        type="file" 
                        onChange={(e) => handleDirectUpload(e, editingService, setEditingService, 'imageUrl')} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="admin-btn admin-btn-primary"><FiSave /> Update Service</button>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditingService(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddService} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--admin-border)', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '14px' }}>Add Service Item</h4>
                
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Service Title</label>
                    <input type="text" className="admin-input" value={newService.title} onChange={e => setNewService({ ...newService, title: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Display Order</label>
                    <input type="number" className="admin-input" value={newService.order} onChange={e => setNewService({ ...newService, order: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Card Accent Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" className="admin-input" style={{ width: '40px', padding: '2px', height: '40px', cursor: 'pointer' }} value={newService.color || '#8B5CF6'} onChange={e => setNewService({ ...newService, color: e.target.value })} />
                      <input type="text" className="admin-input" value={newService.color || '#8B5CF6'} onChange={e => setNewService({ ...newService, color: e.target.value })} placeholder="#8B5CF6" />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Icon Source Type</label>
                    <select className="admin-select" value={newService.iconType || 'iconName'} onChange={e => setNewService({ ...newService, iconType: e.target.value })}>
                      <option value="iconName">React Icon Name (FiPenTool, etc.)</option>
                      <option value="svgCode">Custom SVG Code</option>
                    </select>
                  </div>
                </div>

                {newService.iconType === 'svgCode' ? (
                  <div className="admin-form-group">
                    <label className="admin-label">Custom SVG Code</label>
                    <textarea className="admin-textarea" value={newService.iconSvg || ''} onChange={e => setNewService({ ...newService, iconSvg: e.target.value })} placeholder="<svg ...>...</svg>" style={{ fontFamily: 'monospace', fontSize: '12px' }} required></textarea>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '11px', marginTop: '4px' }}>
                      Tip: Use <strong>stroke="currentColor"</strong> or <strong>fill="currentColor"</strong> in your SVG elements so they automatically transition and match your custom card color!
                    </p>
                  </div>
                ) : (
                  <div className="admin-form-group">
                    <label className="admin-label">React Icon Name (from react-icons/fi)</label>
                    <input type="text" className="admin-input" value={newService.iconName || ''} onChange={e => setNewService({ ...newService, iconName: e.target.value })} placeholder="FiPenTool, FiMonitor, FiCode, FiSmartphone..." required />
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-label">Description</label>
                  <textarea className="admin-textarea" value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} required></textarea>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Card Background Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" className="admin-input" style={{ width: '40px', padding: '2px', height: '40px', cursor: 'pointer' }} value={newService.bgColor || '#e7eae0'} onChange={e => setNewService({ ...newService, bgColor: e.target.value })} />
                      <input type="text" className="admin-input" value={newService.bgColor || '#e7eae0'} onChange={e => setNewService({ ...newService, bgColor: e.target.value })} placeholder="#e7eae0" />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Skills (comma-separated)</label>
                    <input type="text" className="admin-input" value={newService.skills || ''} onChange={e => setNewService({ ...newService, skills: e.target.value })} placeholder="Research, Wireframes, User Testing" />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Service Card Image URL</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={newService.imageUrl || ''} 
                      onChange={e => setNewService({ ...newService, imageUrl: e.target.value })} 
                      placeholder="Enter image URL or upload file" 
                    />
                    <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                      Upload Image
                      <input 
                        type="file" 
                        onChange={(e) => handleDirectUpload(e, newService, setNewService, 'imageUrl')} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                </div>

                <button type="submit" className="admin-btn admin-btn-primary"><FiPlus /> Add Service</button>
              </form>
            )}

            {/* List Services */}
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Color</th>
                    <th>Icon</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(ser => (
                    <tr key={ser._id}>
                      <td style={{ fontWeight: '600' }}>{ser.order}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: ser.color || '#8B5CF6', border: '1px solid rgba(255,255,255,0.1)' }}></span>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{ser.color || '#8B5CF6'}</span>
                        </div>
                      </td>
                      <td>
                        {ser.iconType === 'svgCode' ? (
                          <div 
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              color: ser.color || '#8B5CF6',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }} 
                            dangerouslySetInnerHTML={{ __html: ser.iconSvg }} 
                          />
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{ser.iconName || 'FiCpu'}</span>
                        )}
                      </td>
                      <td style={{ fontWeight: '500' }}>{ser.title}</td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>{ser.description}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="admin-btn" 
                            style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--admin-primary)', border: '1px solid rgba(139, 92, 246, 0.2)' }} 
                            onClick={() => handleEditServiceStart(ser)}
                          >
                            <FiEdit3 size={13} />
                          </button>
                          <button 
                            className="admin-btn admin-btn-danger" 
                            style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} 
                            onClick={() => servicesCrud.delete(ser._id)}
                          >
                            <FiTrash2 size={13} />
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

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div>
            <h3 className="admin-panel-title">Skills Listing</h3>

            {/* Add Skill */}
            <form onSubmit={handleAddSkill} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--admin-border)', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', fontSize: '14px' }}>Add Skill Rating</h4>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Skill Name</label>
                  <input type="text" className="admin-input" value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Percentage</label>
                  <input type="number" className="admin-input" min="0" max="100" value={newSkill.percentage} onChange={e => setNewSkill({ ...newSkill, percentage: parseInt(e.target.value) || 0 })} required />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Category</label>
                  <select className="admin-select" value={newSkill.category} onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}>
                    <option value="Design">Design</option>
                    <option value="Development">Development</option>
                    <option value="Tools">Tools</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Display Order</label>
                  <input type="number" className="admin-input" value={newSkill.order} onChange={e => setNewSkill({ ...newSkill, order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <button type="submit" className="admin-btn admin-btn-primary"><FiPlus /> Add Skill</button>
            </form>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Skill Name</th>
                    <th>Percentage</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map(sk => (
                    <tr key={sk._id}>
                      <td style={{ textTransform: 'capitalize', color: 'var(--admin-primary)', fontWeight: '600' }}>{sk.category}</td>
                      <td style={{ fontWeight: '500' }}>{sk.name}</td>
                      <td>{sk.percentage}%</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="admin-btn admin-btn-danger" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => skillsCrud.delete(sk._id)}>
                          <FiTrash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQS TAB */}
        {activeTab === 'faqs' && (
          <div>
            <h3 className="admin-panel-title">Frequently Asked Questions</h3>

            {/* FAQ Section Background Image & Section Title CMS Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSaveSettings('faq', faqForm); }}
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}
            >
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🖼️ FAQ Section Background Image & Title Customization
              </h4>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">FAQ Section Main Heading Title</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={faqForm.title || ''} 
                    onChange={e => setFaqForm({ ...faqForm, title: e.target.value })} 
                    placeholder="Frequently asked Questions" 
                  />
                </div>
              </div>

              <div className="admin-form-group" style={{ marginBottom: '14px' }}>
                <label className="admin-label">FAQ Section Background Image URL (3D Geometric Abstract Blocks)</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    style={{ flex: '1 1 300px' }}
                    value={faqForm.bgImage || ''} 
                    onChange={e => setFaqForm({ ...faqForm, bgImage: e.target.value })} 
                    placeholder="Enter image URL (e.g. /assets/faq_bg_blocks.png or https://...)" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiUpload /> Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, faqForm, setFaqForm, 'bgImage')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setMediaModalTarget({ formState: faqForm, setFormState: setFaqForm, fieldName: 'bgImage' })}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <FiImage /> Choose from Media Library
                  </button>
                </div>

                {/* Active FAQ Background Preview Card */}
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--admin-border)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--admin-text)' }}>Currently Active FAQ Background:</span>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                      {faqForm.bgImage ? (faqForm.bgImage.startsWith('/') ? '3D Geometric Blocks Asset (/assets/faq_bg_blocks.png)' : 'Custom Web Image URL') : 'Default 3D Abstract Blocks (/assets/faq_bg_blocks.png)'}
                    </span>
                  </div>
                  <img 
                    src={faqForm.bgImage || '/assets/faq_bg_blocks.png'} 
                    alt="FAQ Bg Preview" 
                    referrerPolicy="no-referrer"
                    style={{ height: '56px', width: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} 
                  />
                  {faqForm.bgImage && faqForm.bgImage !== '/assets/faq_bg_blocks.png' && (
                    <button 
                      type="button" 
                      onClick={() => setFaqForm(prev => ({ ...prev, bgImage: '/assets/faq_bg_blocks.png' }))}
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                    >
                      Reset to Default 3D Blocks
                    </button>
                  )}
                </div>
              </div>

              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                <FiSave /> Save FAQ Section Settings
              </button>
            </form>
 
            {/* Edit / Add FAQ Form */}
            {editingFaq ? (
              <form onSubmit={handleUpdateFaq} style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '24px', borderRadius: '14px', border: '1px solid rgba(139, 92, 246, 0.4)', marginBottom: '24px', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <FiEdit3 /> Edit FAQ Item
                </h4>
                <div className="admin-form-group">
                  <label className="admin-label">Question</label>
                  <input type="text" className="admin-input" value={editingFaq.question} onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Answer</label>
                  <textarea className="admin-textarea" rows={4} value={editingFaq.answer} onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })} required></textarea>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Display Order</label>
                  <input type="number" className="admin-input" value={editingFaq.order || 0} onChange={e => setEditingFaq({ ...editingFaq, order: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button type="submit" className="admin-btn admin-btn-primary"><FiSave /> Update FAQ Item</button>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditingFaq(null)}>Cancel Edit</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddFaq} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--admin-border)', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '14px' }}>Add FAQ Item</h4>
                <div className="admin-form-group">
                  <label className="admin-label">Question</label>
                  <input type="text" className="admin-input" value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Answer</label>
                  <textarea className="admin-textarea" rows={3} value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} required></textarea>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Display Order</label>
                  <input type="number" className="admin-input" value={newFaq.order || 0} onChange={e => setNewFaq({ ...newFaq, order: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <button type="submit" className="admin-btn admin-btn-primary"><FiPlus /> Add FAQ Item</button>
              </form>
            )}
 
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Answer</th>
                    <th>Order</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs && faqs.length > 0 ? (
                    faqs.map(faq => (
                      <tr key={faq._id}>
                        <td style={{ fontWeight: '600', maxWidth: '240px', whiteSpace: 'normal' }}>{faq.question}</td>
                        <td style={{ color: 'var(--admin-text-muted)', fontSize: '13px', whiteSpace: 'normal' }}>{faq.answer}</td>
                        <td style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>{faq.order || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              className="admin-btn" 
                              style={{ padding: '6px 12px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--admin-primary)', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500' }} 
                              onClick={() => {
                                setEditingFaq(faq);
                                window.scrollTo({ top: 180, behavior: 'smooth' });
                              }}
                              title="Edit FAQ Item"
                            >
                              <FiEdit3 size={13} /> Edit
                            </button>
                            <button 
                              className="admin-btn admin-btn-danger" 
                              style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500' }} 
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete "${faq.question}"?`)) {
                                  const res = await faqsCrud.delete(faq._id);
                                  if (res.success) showToast('FAQ deleted successfully!', 'success');
                                }
                              }}
                              title="Delete FAQ Item"
                            >
                              <FiTrash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '24px' }}>
                        No FAQ items found. Add your first FAQ item above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FOOTER TAB */}
        {activeTab === 'footer' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('footer', footerForm); }}>
            <h3 className="admin-panel-title">Footer & Social Media Manager</h3>

            {/* 1. Footer Card Background Image Settings */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🖼️ Footer Card Background Image
              </h4>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label className="admin-label">Card Background Image File / URL</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={footerForm.bgImage || ''} 
                    onChange={e => {
                      const val = e.target.value;
                      setFooterForm(prev => ({ ...prev, bgImage: val }));
                    }} 
                    placeholder="Enter image URL or upload image file" 
                    style={{ flex: '1', minWidth: '240px' }}
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiUpload /> Upload File
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleDirectUpload(e, footerForm, setFooterForm, 'bgImage')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-secondary"
                    onClick={() => {
                      if (fetchMedia) fetchMedia();
                      setMediaTargetSetter(() => (url) => setFooterForm(prev => ({ ...prev, bgImage: url })));
                      setShowMediaModal(true);
                    }}
                    style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FiImage /> Choose from Media Library
                  </button>
                </div>
                {/* Active Footer Background Preview Card (Always visible) */}
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--admin-border)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--admin-text)' }}>Currently Active Footer Background:</span>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                      {footerForm.bgImage ? 'Custom Image URL / File' : 'Default Sky Landscape Image (/assets/footer_sky_bg.png)'}
                    </span>
                  </div>
                  <img 
                    src={footerForm.bgImage || '/assets/footer_sky_bg.png'} 
                    alt="Footer Bg Preview" 
                    referrerPolicy="no-referrer"
                    style={{ 
                      height: '56px', 
                      width: '100px', 
                      objectFit: 'cover', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(255, 255, 255, 0.2)', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      filter: `blur(${footerForm.bgBlur !== undefined ? footerForm.bgBlur : 12}px) brightness(${footerForm.bgBrightness !== undefined ? footerForm.bgBrightness : 100}%)`,
                      transition: 'filter 0.3s ease'
                    }} 
                  />
                  {footerForm.bgImage && (
                    <button 
                      type="button" 
                      onClick={() => setFooterForm(prev => ({ ...prev, bgImage: '' }))}
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                    >
                      Reset to Default Sky Image
                    </button>
                  )}
                </div>

                {/* Background Blur & Brightness Filters Sliders */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--admin-border)' }}>
                  <h5 style={{ margin: '0 0 14px 0', fontSize: '13.5px', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ✨ Background Image Blur & Brightness Filters
                  </h5>

                  <div className="admin-form-row">
                    {/* Blur Slider */}
                    <div className="admin-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="admin-label" style={{ margin: 0 }}>💧 Blur Effect Level</label>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#8B5CF6', background: 'rgba(139,92,246,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          {footerForm.bgBlur !== undefined ? footerForm.bgBlur : 12}px
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="40" 
                        step="1"
                        value={footerForm.bgBlur !== undefined ? footerForm.bgBlur : 12} 
                        onChange={e => setFooterForm({ ...footerForm, bgBlur: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Off (0px)', val: 0 },
                          { label: 'Subtle (6px)', val: 6 },
                          { label: 'Default (12px)', val: 12 },
                          { label: 'Heavy (24px)', val: 24 }
                        ].map(p => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => setFooterForm(prev => ({ ...prev, bgBlur: p.val }))}
                            style={{
                              padding: '3px 8px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer',
                              border: (footerForm.bgBlur !== undefined ? footerForm.bgBlur : 12) === p.val ? '1px solid #8B5CF6' : '1px solid var(--admin-border)',
                              background: (footerForm.bgBlur !== undefined ? footerForm.bgBlur : 12) === p.val ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                              color: 'var(--admin-text)'
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brightness Slider */}
                    <div className="admin-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="admin-label" style={{ margin: 0 }}>☀️ Image Brightness Level</label>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#8B5CF6', background: 'rgba(139,92,246,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          {footerForm.bgBrightness !== undefined ? footerForm.bgBrightness : 100}%
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="150" 
                        step="5"
                        value={footerForm.bgBrightness !== undefined ? footerForm.bgBrightness : 100} 
                        onChange={e => setFooterForm({ ...footerForm, bgBrightness: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Dark (50%)', val: 50 },
                          { label: 'Dim (75%)', val: 75 },
                          { label: 'Default (100%)', val: 100 },
                          { label: 'Bright (125%)', val: 125 }
                        ].map(p => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => setFooterForm(prev => ({ ...prev, bgBrightness: p.val }))}
                            style={{
                              padding: '3px 8px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer',
                              border: (footerForm.bgBrightness !== undefined ? footerForm.bgBrightness : 100) === p.val ? '1px solid #8B5CF6' : '1px solid var(--admin-border)',
                              background: (footerForm.bgBrightness !== undefined ? footerForm.bgBrightness : 100) === p.val ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                              color: 'var(--admin-text)'
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Email & Author Credit Settings */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Giant Display Contact Email</label>
                <input type="email" className="admin-input" value={footerForm.contactEmail || ''} onChange={e => setFooterForm({ ...footerForm, contactEmail: e.target.value })} placeholder="avfaheeeem@gmail.com" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Author Credit Name (Theme created by ...)</label>
                <input type="text" className="admin-input" value={footerForm.authorName || ''} onChange={e => setFooterForm({ ...footerForm, authorName: e.target.value })} placeholder="Faheem" />
              </div>
            </div>

            {/* Email Heading Text Color Toggle */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔤 Email Heading Text Color
              </h4>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Black option */}
                <button
                  type="button"
                  onClick={() => setFooterForm(prev => ({ ...prev, emailTextColor: 'dark' }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 20px', borderRadius: '12px', cursor: 'pointer',
                    fontWeight: '700', fontSize: '13px', transition: 'all 0.2s',
                    border: (footerForm.emailTextColor || 'dark') === 'dark'
                      ? '2px solid #8B5CF6'
                      : '2px solid rgba(255,255,255,0.15)',
                    background: (footerForm.emailTextColor || 'dark') === 'dark'
                      ? 'rgba(139,92,246,0.15)'
                      : 'rgba(255,255,255,0.04)',
                    color: 'var(--admin-text)'
                  }}
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#0d0d12', border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block', flexShrink: 0 }} />
                  Black Text
                  {(footerForm.emailTextColor || 'dark') === 'dark' && <FiCheck style={{ color: '#8B5CF6', marginLeft: 4 }} />}
                </button>

                {/* White option */}
                <button
                  type="button"
                  onClick={() => setFooterForm(prev => ({ ...prev, emailTextColor: 'white' }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 20px', borderRadius: '12px', cursor: 'pointer',
                    fontWeight: '700', fontSize: '13px', transition: 'all 0.2s',
                    border: footerForm.emailTextColor === 'white'
                      ? '2px solid #8B5CF6'
                      : '2px solid rgba(255,255,255,0.15)',
                    background: footerForm.emailTextColor === 'white'
                      ? 'rgba(139,92,246,0.15)'
                      : 'rgba(255,255,255,0.04)',
                    color: 'var(--admin-text)'
                  }}
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.25)', display: 'inline-block', flexShrink: 0 }} />
                  White Text
                  {footerForm.emailTextColor === 'white' && <FiCheck style={{ color: '#8B5CF6', marginLeft: 4 }} />}
                </button>

                {/* Live Preview */}
                <div style={{
                  padding: '10px 20px', borderRadius: '12px',
                  background: footerForm.emailTextColor === 'white' ? '#1a1a2e' : '#f0f0f5',
                  border: '1px solid rgba(255,255,255,0.12)', fontSize: '13px', fontWeight: '900',
                  color: footerForm.emailTextColor === 'white' ? '#ffffff' : '#0d0d12',
                  letterSpacing: '-0.03em'
                }}>
                  hello@preview.design
                </div>
              </div>
            </div>

            {/* 3. Social Media Links Manager */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔗 Social Media Links Manager
              </h4>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">🐙 GitHub URL</label>
                  <input type="text" className="admin-input" value={footerForm.githubUrl || ''} onChange={e => setFooterForm({ ...footerForm, githubUrl: e.target.value })} placeholder="https://github.com/username" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">💼 LinkedIn URL</label>
                  <input type="text" className="admin-input" value={footerForm.linkedinUrl || ''} onChange={e => setFooterForm({ ...footerForm, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/username" />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">📸 Instagram URL</label>
                  <input type="text" className="admin-input" value={footerForm.instagramUrl || ''} onChange={e => setFooterForm({ ...footerForm, instagramUrl: e.target.value })} placeholder="https://instagram.com/username" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">💬 WhatsApp Direct Link / Number</label>
                  <input type="text" className="admin-input" value={footerForm.whatsappUrl || ''} onChange={e => setFooterForm({ ...footerForm, whatsappUrl: e.target.value })} placeholder="https://wa.me/917356164236" />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">📘 Facebook URL</label>
                  <input type="text" className="admin-input" value={footerForm.facebookUrl || ''} onChange={e => setFooterForm({ ...footerForm, facebookUrl: e.target.value })} placeholder="https://facebook.com/username" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">🌐 Dribbble / Website / Portfolio URL</label>
                  <input type="text" className="admin-input" value={footerForm.dribbbleUrl || ''} onChange={e => setFooterForm({ ...footerForm, dribbbleUrl: e.target.value })} placeholder="https://dribbble.com/username" />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">🐦 Twitter / X URL</label>
                <input type="text" className="admin-input" value={footerForm.twitterUrl || ''} onChange={e => setFooterForm({ ...footerForm, twitterUrl: e.target.value })} placeholder="https://x.com/username" />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Logo Text</label>
                <input type="text" className="admin-input" value={footerForm.logoText || ''} onChange={e => setFooterForm({ ...footerForm, logoText: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Copyright Text</label>
                <input type="text" className="admin-input" value={footerForm.copyrightText || ''} onChange={e => setFooterForm({ ...footerForm, copyrightText: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              <FiSave /> Save Footer Settings
            </button>
          </form>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('contact', contactForm); }}>
            <h3 className="admin-panel-title">Contact Form & Details Settings</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Contact Heading</label>
                <input type="text" className="admin-input" value={contactForm.heading} onChange={e => setContactForm({ ...contactForm, heading: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Contact Subtitle/Description</label>
                <input type="text" className="admin-input" value={contactForm.description} onChange={e => setContactForm({ ...contactForm, description: e.target.value })} />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Admin Email Address (Submissions Sent Here)</label>
                <input type="email" className="admin-input" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">WhatsApp Number (+917356164236)</label>
                <input type="text" className="admin-input" value={contactForm.whatsapp} onChange={e => setContactForm({ ...contactForm, whatsapp: e.target.value })} />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Phone Number</label>
                <input type="text" className="admin-input" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Google Maps Link</label>
                <input type="text" className="admin-input" value={contactForm.mapUrl} onChange={e => setContactForm({ ...contactForm, mapUrl: e.target.value })} />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Address</label>
              <input type="text" className="admin-input" value={contactForm.address} onChange={e => setContactForm({ ...contactForm, address: e.target.value })} />
            </div>

            <div className="admin-form-group" style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px', marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '16px' }}>Email & Integration Controls</h4>
              <div className="admin-form-group">
                <label className="admin-label">Notification Email Subject (use {"{{name}}"} placeholder)</label>
                <input type="text" className="admin-input" value={contactForm.emailSubject} onChange={e => setContactForm({ ...contactForm, emailSubject: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '30px', margin: '24px 0', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={contactForm.enableForm} onChange={e => setContactForm({ ...contactForm, enableForm: e.target.checked })} />
                Enable Public Contact Form
              </label>
              <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={contactForm.enableAutoReply} onChange={e => setContactForm({ ...contactForm, enableAutoReply: e.target.checked })} />
                Enable Auto-Reply Confirmation Email
              </label>
              <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={contactForm.enableWhatsappButton} onChange={e => setContactForm({ ...contactForm, enableWhatsappButton: e.target.checked })} />
                Enable WhatsApp Direct Connect Button
              </label>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              <FiSave /> Save Contact Settings
            </button>
          </form>
        )}

        {/* SEO TAB */}
        {activeTab === 'seo' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('seo', seoForm); }}>
            <h3 className="admin-panel-title">SEO Configuration</h3>
            <div className="admin-form-group">
              <label className="admin-label">Meta Website Title</label>
              <input type="text" className="admin-input" value={seoForm.siteTitle} onChange={e => setSeoForm({ ...seoForm, siteTitle: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Keywords (comma separated)</label>
              <input type="text" className="admin-input" value={seoForm.keywords} onChange={e => setSeoForm({ ...seoForm, keywords: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Meta Description</label>
              <textarea className="admin-textarea" value={seoForm.metaDescription} onChange={e => setSeoForm({ ...seoForm, metaDescription: e.target.value })}></textarea>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Favicon URL</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={seoForm.favicon || ''} 
                    onChange={e => setSeoForm({ ...seoForm, favicon: e.target.value })} 
                    placeholder="Favicon file path" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload Icon
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, seoForm, setSeoForm, 'favicon')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Open Graph Social Image</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={seoForm.ogImage || ''} 
                    onChange={e => setSeoForm({ ...seoForm, ogImage: e.target.value })} 
                    placeholder="OG Image URL" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload Image
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, seoForm, setSeoForm, 'ogImage')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              <FiSave /> Save SEO Tags
            </button>
          </form>
        )}

        {/* GLOBAL BRANDING TAB */}
        {activeTab === 'global' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('global', globalForm); }}>
            <h3 className="admin-panel-title">Global Branding</h3>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Portfolio Site Owner Name</label>
                <input type="text" className="admin-input" value={globalForm.portfolioName} onChange={e => setGlobalForm({ ...globalForm, portfolioName: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Website Domain URL</label>
                <input type="text" className="admin-input" value={globalForm.websiteUrl} onChange={e => setGlobalForm({ ...globalForm, websiteUrl: e.target.value })} />
              </div>
            </div>

            {/* Preloader / Loading Screen Complete Management Controls */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-border)', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--admin-text-main)' }}>
                Preloader / Loading Screen Content Controls
              </h3>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Top-Left Title Text (Default: LOADING)</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={globalForm.loaderTitle || ''} 
                    onChange={e => setGlobalForm({ ...globalForm, loaderTitle: e.target.value })} 
                    placeholder="LOADING" 
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Bottom-Right Subtitle / Changing Words</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={globalForm.loaderText || ''} 
                    onChange={e => setGlobalForm({ ...globalForm, loaderText: e.target.value })} 
                    placeholder="UI / UX DESIGNER & FRONTEND DEVELOPER (or comma-separated: UI / UX DESIGNER, FRONTEND DEVELOPER, CREATING ART)" 
                  />
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px', display: 'block' }}>
                    Single title or comma-separated words to rotate them smoothly during loading.
                  </span>
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '14px', color: 'var(--admin-text-muted)' }}>
                5 Preloader Slideshow Images (Bottom-Left 4:3 Editorial Frame)
              </h4>

              {[1, 2, 3, 4, 5].map((num) => {
                const fieldName = `loaderImage${num}`;
                const ranges = ["0% – 20%", "20% – 40%", "40% – 60%", "60% – 80%", "80% – 100%"];
                return (
                  <div key={num} className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label className="admin-label">Image {num} ({ranges[num - 1]})</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="admin-input" 
                        value={globalForm[fieldName] || ''} 
                        onChange={e => setGlobalForm({ ...globalForm, [fieldName]: e.target.value })} 
                        placeholder={`Enter Image ${num} URL or upload file`} 
                      />
                      <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                        Upload File
                        <input 
                          type="file" 
                          onChange={(e) => handleDirectUpload(e, globalForm, setGlobalForm, fieldName)} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                    </div>
                    {globalForm[fieldName] && (
                      <div style={{ marginTop: '8px' }}>
                        <img 
                          src={globalForm[fieldName]} 
                          alt={`Preview ${num}`} 
                          style={{ width: '100px', height: '75px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--admin-border)' }} 
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Favicon URL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="admin-input" 
                  value={globalForm.favicon || ''} 
                  onChange={e => setGlobalForm({ ...globalForm, favicon: e.target.value })} 
                  placeholder="Enter favicon URL or upload file" 
                />
                <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                  Upload File
                  <input 
                    type="file" 
                    onChange={(e) => handleDirectUpload(e, globalForm, setGlobalForm, 'favicon')} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Primary Color HEX Code</label>
                <input type="text" className="admin-input" value={globalForm.primaryColor} onChange={e => setGlobalForm({ ...globalForm, primaryColor: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Accent Color HEX Code</label>
                <input type="text" className="admin-input" value={globalForm.accentColor} onChange={e => setGlobalForm({ ...globalForm, accentColor: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              <FiSave /> Save Global Settings
            </button>
          </form>
        )}

        {/* THEME CONTROLLER TAB */}
        {activeTab === 'theme' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('theme', themeForm); }}>
            <h3 className="admin-panel-title">Theme Controller Settings</h3>
            
            <div className="admin-form-group">
              <label className="admin-label">Theme Mode Selection</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                
                {/* Mode 1: System Default */}
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  borderRadius: '12px',
                  background: themeForm.mode === 'system' ? 'var(--admin-primary-glow)' : 'var(--admin-input-bg)',
                  border: `2px solid ${themeForm.mode === 'system' ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px', color: 'var(--admin-text-main)' }}>
                    <input 
                      type="radio" 
                      name="themeMode" 
                      value="system" 
                      checked={themeForm.mode === 'system'} 
                      onChange={() => setThemeForm({ mode: 'system' })} 
                    />
                    System Default
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    Follows user's Operating System theme scheme on load (supports toggle switcher override).
                  </span>
                </label>

                {/* Mode 2: User Choice */}
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  borderRadius: '12px',
                  background: themeForm.mode === 'user' ? 'var(--admin-primary-glow)' : 'var(--admin-input-bg)',
                  border: `2px solid ${themeForm.mode === 'user' ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px', color: 'var(--admin-text-main)' }}>
                    <input 
                      type="radio" 
                      name="themeMode" 
                      value="user" 
                      checked={themeForm.mode === 'user'} 
                      onChange={() => setThemeForm({ mode: 'user' })} 
                    />
                    User Choice
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    Shows the theme toggle switcher and remembers the user's selected mode inside localStorage.
                  </span>
                </label>

                {/* Mode 3: Force Light */}
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  borderRadius: '12px',
                  background: themeForm.mode === 'light' ? 'var(--admin-primary-glow)' : 'var(--admin-input-bg)',
                  border: `2px solid ${themeForm.mode === 'light' ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px', color: 'var(--admin-text-main)' }}>
                    <input 
                      type="radio" 
                      name="themeMode" 
                      value="light" 
                      checked={themeForm.mode === 'light'} 
                      onChange={() => setThemeForm({ mode: 'light' })} 
                    />
                    Force Light
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    Forces Light Mode layout across the entire site. Disables/hides the theme toggle switcher.
                  </span>
                </label>

                {/* Mode 4: Force Dark */}
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  borderRadius: '12px',
                  background: themeForm.mode === 'dark' ? 'var(--admin-primary-glow)' : 'var(--admin-input-bg)',
                  border: `2px solid ${themeForm.mode === 'dark' ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px', color: 'var(--admin-text-main)' }}>
                    <input 
                      type="radio" 
                      name="themeMode" 
                      value="dark" 
                      checked={themeForm.mode === 'dark'} 
                      onChange={() => setThemeForm({ mode: 'dark' })} 
                    />
                    Force Dark
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    Forces Dark Mode layout across the entire site. Disables/hides the theme toggle switcher.
                  </span>
                </label>

              </div>
            </div>

            {/* LIVE PREVIEW SECTION */}
            <div style={{
              marginTop: '32px',
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--admin-bg)',
              border: '1px dashed var(--admin-border)',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--admin-text-muted)' }}>
                Live Theme Preview
              </h4>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Configured Mode</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--admin-text-main)', textTransform: 'capitalize' }}>
                    {themeForm.mode}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Toggle Switcher State</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: themeForm.mode === 'light' || themeForm.mode === 'dark' ? 'var(--admin-error)' : 'var(--admin-success)' }}>
                    {themeForm.mode === 'light' || themeForm.mode === 'dark' ? 'Hidden / Disabled' : 'Visible / Active'}
                  </span>
                </div>

                {/* Simulated Web Card Preview */}
                <div style={{
                  padding: '16px 24px',
                  borderRadius: '12px',
                  background: themeForm.mode === 'dark' || (themeForm.mode === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches) ? '#0a0a0f' : '#ffffff',
                  color: themeForm.mode === 'dark' || (themeForm.mode === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches) ? '#f3f4f6' : '#0f172a',
                  border: '1px solid var(--admin-border)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  minWidth: '240px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8b5cf6' }}>PORTFOLIO PREVIEW</span>
                    {(themeForm.mode === 'system' || themeForm.mode === 'user') && (
                      <span style={{ fontSize: '12px' }}>
                        {themeForm.mode === 'dark' || (themeForm.mode === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches) ? '🌙' : '☀️'}
                      </span>
                    )}
                  </div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>Sample Title Text</h5>
                  <p style={{ margin: 0, fontSize: '11px', opacity: 0.7 }}>This simulates the frontend card layout contrast.</p>
                </div>
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '24px' }} disabled={saving}>
              <FiSave /> Save Theme Configuration
            </button>
          </form>
        )}

        {/* CHAT WIDGET TAB */}
        {activeTab === 'chat' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('chat', chatForm); }}>
            <h3 className="admin-panel-title">💬 WhatsApp Chat Bot & Assistant Controls</h3>
            <p className="admin-header-subtitle" style={{ marginBottom: '24px' }}>
              Turn the floating WhatsApp chat widget ON or OFF, and customize colors, fonts, welcome messages, and pre-filled quick action templates.
            </p>

            {/* ⚡ Master WhatsApp Chat Bot ON / OFF Toggle Card */}
            <div style={{
              background: chatForm.enabled !== false 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)' 
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(185, 28, 28, 0.03) 100%)',
              border: `2px solid ${chatForm.enabled !== false ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: chatForm.enabled !== false ? '0 8px 24px rgba(16, 185, 129, 0.1)' : 'none'
            }}>
              <div style={{ flex: '1 1 260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: chatForm.enabled !== false ? '#10B981' : '#EF4444',
                    boxShadow: chatForm.enabled !== false ? '0 0 10px #10B981' : '0 0 10px #EF4444'
                  }} />
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--admin-text)' }}>
                    WhatsApp Chat Bot Status: {chatForm.enabled !== false ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--admin-text-muted)', lineHeight: '1.5' }}>
                  {chatForm.enabled !== false 
                    ? '🟢 The floating WhatsApp quick chat button and interactive bot modal ARE CURRENTLY VISIBLE on all pages.'
                    : '🔴 The floating WhatsApp quick chat button is HIDDEN from all portfolio pages.'}
                </p>
              </div>

              {/* iOS-Style Master Toggle Switch Button */}
              <button
                type="button"
                onClick={() => setChatForm(prev => ({ ...prev, enabled: prev.enabled === false ? true : false }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '14px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: chatForm.enabled !== false ? '#10B981' : '#374151',
                  color: '#ffffff',
                  boxShadow: chatForm.enabled !== false ? '0 6px 20px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: chatForm.enabled !== false ? '#10B981' : '#374151',
                  fontWeight: '900'
                }}>
                  {chatForm.enabled !== false ? '✓' : '✕'}
                </span>
                {chatForm.enabled !== false ? 'CHAT BOT IS ON' : 'CHAT BOT IS OFF'}
              </button>
            </div>

            <hr style={{ borderColor: 'var(--admin-border)', margin: '24px 0' }} />

            {/* 1. Floating Pill Button Customization */}
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              1. Floating Trigger Button Design
            </h4>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Button Label Text</label>
                <input type="text" className="admin-input" value={chatForm.buttonText} onChange={e => setChatForm({ ...chatForm, buttonText: e.target.value })} placeholder="Quick Chat" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Button Font Family</label>
                <select className="admin-input" value={chatForm.fontFamily} onChange={e => setChatForm({ ...chatForm, fontFamily: e.target.value })}>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Geist">Geist</option>
                  <option value="Fira Code">Fira Code</option>
                </select>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Button Background Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={chatForm.buttonBgColor || '#0d0d11'} onChange={e => setChatForm({ ...chatForm, buttonBgColor: e.target.value })} style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <input type="text" className="admin-input" value={chatForm.buttonBgColor} onChange={e => setChatForm({ ...chatForm, buttonBgColor: e.target.value })} />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Button Text Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={chatForm.buttonTextColor || '#ffffff'} onChange={e => setChatForm({ ...chatForm, buttonTextColor: e.target.value })} style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <input type="text" className="admin-input" value={chatForm.buttonTextColor} onChange={e => setChatForm({ ...chatForm, buttonTextColor: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">WhatsApp Icon Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={chatForm.buttonIconColor || '#25D366'} onChange={e => setChatForm({ ...chatForm, buttonIconColor: e.target.value })} style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <input type="text" className="admin-input" value={chatForm.buttonIconColor} onChange={e => setChatForm({ ...chatForm, buttonIconColor: e.target.value })} />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Online Status Dot Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={chatForm.buttonDotColor || '#10B981'} onChange={e => setChatForm({ ...chatForm, buttonDotColor: e.target.value })} style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <input type="text" className="admin-input" value={chatForm.buttonDotColor} onChange={e => setChatForm({ ...chatForm, buttonDotColor: e.target.value })} />
                </div>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--admin-border)', margin: '24px 0' }} />

            {/* 2. Modal Header & Window Theme */}
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              2. Chat Modal & Window Styling
            </h4>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Header Title Text</label>
                <input type="text" className="admin-input" value={chatForm.headerTitle} onChange={e => setChatForm({ ...chatForm, headerTitle: e.target.value })} placeholder="Faheem" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Header Subtitle Status</label>
                <input type="text" className="admin-input" value={chatForm.headerStatusText} onChange={e => setChatForm({ ...chatForm, headerStatusText: e.target.value })} placeholder="Online • Replies in minutes" />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Header Background Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={chatForm.headerBgColor || '#0F8C6E'} onChange={e => setChatForm({ ...chatForm, headerBgColor: e.target.value })} style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <input type="text" className="admin-input" value={chatForm.headerBgColor} onChange={e => setChatForm({ ...chatForm, headerBgColor: e.target.value })} />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Chat Window Background</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={chatForm.chatBgColor || '#0b0b0f'} onChange={e => setChatForm({ ...chatForm, chatBgColor: e.target.value })} style={{ width: '42px', height: '42px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <input type="text" className="admin-input" value={chatForm.chatBgColor} onChange={e => setChatForm({ ...chatForm, chatBgColor: e.target.value })} />
                </div>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--admin-border)', margin: '24px 0' }} />

            {/* 3. Welcome Messages & Quick Actions */}
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              3. Messages & Quick Actions Setup
            </h4>

            <div className="admin-form-group">
              <label className="admin-label">Welcome Message Line 1</label>
              <input type="text" className="admin-input" value={chatForm.welcomeMessageLine1} onChange={e => setChatForm({ ...chatForm, welcomeMessageLine1: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Welcome Message Line 2</label>
              <input type="text" className="admin-input" value={chatForm.welcomeMessageLine2} onChange={e => setChatForm({ ...chatForm, welcomeMessageLine2: e.target.value })} />
            </div>

            <div style={{ background: 'var(--admin-bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--admin-border)', margin: '20px 0' }}>
              <h5 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 'bold' }}>Quick Action 1</h5>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Button Label</label>
                  <input type="text" className="admin-input" value={chatForm.quickAction1Text} onChange={e => setChatForm({ ...chatForm, quickAction1Text: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Pre-filled WhatsApp Message</label>
                  <input type="text" className="admin-input" value={chatForm.quickAction1Message} onChange={e => setChatForm({ ...chatForm, quickAction1Message: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--admin-bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--admin-border)', margin: '20px 0' }}>
              <h5 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 'bold' }}>Quick Action 2</h5>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Button Label</label>
                  <input type="text" className="admin-input" value={chatForm.quickAction2Text} onChange={e => setChatForm({ ...chatForm, quickAction2Text: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Pre-filled WhatsApp Message</label>
                  <input type="text" className="admin-input" value={chatForm.quickAction2Message} onChange={e => setChatForm({ ...chatForm, quickAction2Message: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--admin-bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--admin-border)', margin: '20px 0' }}>
              <h5 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 'bold' }}>Quick Action 3</h5>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Button Label</label>
                  <input type="text" className="admin-input" value={chatForm.quickAction3Text} onChange={e => setChatForm({ ...chatForm, quickAction3Text: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Pre-filled WhatsApp Message</label>
                  <input type="text" className="admin-input" value={chatForm.quickAction3Message} onChange={e => setChatForm({ ...chatForm, quickAction3Message: e.target.value })} />
                </div>
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '24px' }} disabled={saving}>
              <FiSave /> Save Chat Widget Configurations
            </button>
          </form>
        )}
      </div>

      {/* ── MEDIA LIBRARY PICKER MODAL ── */}
      {showMediaModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--admin-card-bg, #12131a)', border: '1px solid var(--admin-border)',
            borderRadius: '20px', width: '100%', maxWidth: '720px', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiImage style={{ color: '#8B5CF6' }} /> Select Image from Media Library
              </h3>
              <button 
                type="button"
                onClick={() => setShowMediaModal(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '20px', cursor: 'pointer' }}
              >
                <FiX />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
              {media && media.length > 0 ? (
                media.map((item) => {
                  const url = item.fileUrl || item.url;
                  return (
                    <div 
                      key={item._id || item.url}
                      onClick={() => {
                        if (mediaTargetSetter) mediaTargetSetter(url);
                        setShowMediaModal(false);
                        showToast('Image selected! Click Save Footer Settings to apply.', 'success');
                      }}
                      style={{
                        position: 'relative', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.1)', background: '#08080a', aspectRatio: '16/10',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <img src={url} alt={item.fileName || 'Media'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.75)', padding: '4px 6px', fontSize: '10px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.fileName || 'Image'}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  No uploaded media files found in Media Library. Upload a file above!
                </div>
              )}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="admin-btn admin-btn-secondary" 
                onClick={() => setShowMediaModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'success' ? 'var(--admin-success)' : 'var(--admin-error)',
          color: '#ffffff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          fontSize: '14px',
          animation: 'slideIn 0.3s ease forwards'
        }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
