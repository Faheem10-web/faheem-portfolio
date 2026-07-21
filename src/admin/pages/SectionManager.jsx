import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FiSave, FiPlus, FiTrash2, FiEdit3 } from 'react-icons/fi';
import '../Admin.css';

export default function SectionManager() {
  const { 
    siteSettings, updateSettings, 
    services, servicesCrud,
    skills, skillsCrud,
    experiencesCrud,
    faqs, faqsCrud,
    uploadMediaFile
  } = useAdmin();

  const handleDirectUpload = async (e, formState, setFormStateCallback, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await uploadMediaFile(file);
    if (res.success && res.url) {
      setFormStateCallback({ ...formState, [fieldName]: res.url });
    } else {
      showToast('Upload failed.', 'error');
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
  const [navForm, setNavForm] = useState({ logoText: '', logoImage: '', downloadCvBtnText: '', downloadCvBtnVisible: true, themeToggleVisible: true, stickyNavbar: true });
  const [aboutForm, setAboutForm] = useState({ title: '', subtitle: '', description: '', experienceYears: 3, aboutImage: '' });
  const [footerForm, setFooterForm] = useState({ logoText: '', copyrightText: '', description: '', contactEmail: '', bgVideo: '' });
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

  // Initialize forms when siteSettings updates
  useEffect(() => {
    if (siteSettings.hero) setHeroForm({ ...siteSettings.hero, words: siteSettings.hero.words ? siteSettings.hero.words.join(', ') : '' });
    if (siteSettings.navbar) setNavForm({ ...siteSettings.navbar });
    if (siteSettings.about) setAboutForm({ ...siteSettings.about });
    if (siteSettings.footer) setFooterForm({ ...siteSettings.footer });
    if (siteSettings.seo) setSeoForm({ ...siteSettings.seo, keywords: siteSettings.seo.keywords ? siteSettings.seo.keywords.join(', ') : '' });
    if (siteSettings.global) setGlobalForm({ ...siteSettings.global });
    if (siteSettings.theme) setThemeForm({ ...siteSettings.theme });
    if (siteSettings.resume) setResumeForm({ ...siteSettings.resume });
    if (siteSettings.contact) setContactForm({ ...siteSettings.contact });
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
    order: 0 
  });
  const [editingService, setEditingService] = useState(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', order: 0 });
  const [editingFaq, setEditingFaq] = useState(null);
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Design', percentage: 80, order: 0 });

  const handleAddService = async (e) => {
    e.preventDefault();
    await servicesCrud.create(newService);
    setNewService({ 
      title: '', 
      description: '', 
      iconName: 'FiCpu', 
      color: '#8B5CF6', 
      iconType: 'iconName', 
      iconSvg: '', 
      order: 0 
    });
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    const res = await servicesCrud.update(editingService._id, {
      title: editingService.title,
      description: editingService.description,
      iconName: editingService.iconName,
      color: editingService.color || '#8B5CF6',
      iconType: editingService.iconType || 'iconName',
      iconSvg: editingService.iconSvg || '',
      order: editingService.order || 0
    });
    if (res.success) {
      setEditingService(null);
    } else {
      alert('Failed to update Service.');
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    await faqsCrud.create(newFaq);
    setNewFaq({ question: '', answer: '', order: 0 });
  };

  const handleUpdateFaq = async (e) => {
    e.preventDefault();
    if (!editingFaq) return;
    const res = await faqsCrud.update(editingFaq._id, {
      question: editingFaq.question,
      answer: editingFaq.answer,
      order: editingFaq.order
    });
    if (res.success) {
      setEditingFaq(null);
    } else {
      alert('Failed to update FAQ.');
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
        {['hero', 'navbar', 'about', 'services', 'skills', 'faqs', 'contact', 'footer', 'seo', 'global', 'theme'].map(tab => (
          <button 
            key={tab} 
            className={`admin-btn ${activeTab === tab ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'theme' ? 'THEME CONTROLLER' : tab.toUpperCase()}
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
              <h3 className="admin-panel-title">Navbar Configuration</h3>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Logo Text</label>
                  <input type="text" className="admin-input" value={navForm.logoText} onChange={e => setNavForm({ ...navForm, logoText: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">CV Button Text</label>
                  <input type="text" className="admin-input" value={navForm.downloadCvBtnText} onChange={e => setNavForm({ ...navForm, downloadCvBtnText: e.target.value })} />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Logo Image URL (optional branding)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="admin-input" 
                    value={navForm.logoImage || ''} 
                    onChange={e => setNavForm({ ...navForm, logoImage: e.target.value })} 
                    placeholder="Enter logo image URL or upload file" 
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                    Upload File
                    <input 
                      type="file" 
                      onChange={(e) => handleDirectUpload(e, navForm, setNavForm, 'logoImage')} 
                      style={{ display: 'none' }} 
                    />
                  </label>
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
                            onClick={() => setEditingService(ser)}
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
 
            {/* Edit / Add FAQ Form */}
            {editingFaq ? (
              <form onSubmit={handleUpdateFaq} style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid var(--admin-primary)', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiEdit3 /> Edit FAQ Item
                </h4>
                <div className="admin-form-group">
                  <label className="admin-label">Question</label>
                  <input type="text" className="admin-input" value={editingFaq.question} onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Answer</label>
                  <textarea className="admin-textarea" value={editingFaq.answer} onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })} required></textarea>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="admin-btn admin-btn-primary"><FiSave /> Update FAQ</button>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditingFaq(null)}>Cancel</button>
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
                  <textarea className="admin-textarea" value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} required></textarea>
                </div>
                <button type="submit" className="admin-btn admin-btn-primary"><FiPlus /> Add FAQ</button>
              </form>
            )}
 
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Answer</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map(faq => (
                    <tr key={faq._id}>
                      <td style={{ fontWeight: '600', maxWidth: '200px', whiteSpace: 'normal' }}>{faq.question}</td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '13px', whiteSpace: 'normal' }}>{faq.answer}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="admin-btn" 
                            style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--admin-primary)', border: '1px solid rgba(139, 92, 246, 0.2)' }} 
                            onClick={() => setEditingFaq(faq)}
                          >
                            <FiEdit3 size={13} />
                          </button>
                          <button 
                            className="admin-btn admin-btn-danger" 
                            style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} 
                            onClick={() => faqsCrud.delete(faq._id)}
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

        {/* FOOTER TAB */}
        {activeTab === 'footer' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings('footer', footerForm); }}>
            <h3 className="admin-panel-title">Footer Settings</h3>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Logo Text</label>
                <input type="text" className="admin-input" value={footerForm.logoText} onChange={e => setFooterForm({ ...footerForm, logoText: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Contact Email</label>
                <input type="email" className="admin-input" value={footerForm.contactEmail} onChange={e => setFooterForm({ ...footerForm, contactEmail: e.target.value })} />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Copyright Text</label>
              <input type="text" className="admin-input" value={footerForm.copyrightText} onChange={e => setFooterForm({ ...footerForm, copyrightText: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Footer Background Video URL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="admin-input" 
                  value={footerForm.bgVideo || ''} 
                  onChange={e => setFooterForm({ ...footerForm, bgVideo: e.target.value })} 
                  placeholder="Enter video URL or upload file" 
                />
                <label className="admin-btn admin-btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                  Upload Video
                  <input 
                    type="file" 
                    onChange={(e) => handleDirectUpload(e, footerForm, setFooterForm, 'bgVideo')} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Short Description</label>
              <textarea className="admin-textarea" value={footerForm.description} onChange={e => setFooterForm({ ...footerForm, description: e.target.value })}></textarea>
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

      </div>

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
