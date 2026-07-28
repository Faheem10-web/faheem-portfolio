import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiExternalLink, FiGithub, FiFigma, FiCheck, 
  FiX, FiChevronRight, FiArrowLeft, FiMaximize2,
  FiUser, FiCalendar, FiEdit3, FiClock
} from "react-icons/fi";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config/api";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";
import "./CaseStudyPage.css";

export default function CaseStudyPage() {
  const { id } = useParams();
  const { projects } = useAdmin();
  
  // Instant synchronous lookup from context or cached projects array for 0ms lag
  const contextProject = (projects || []).find(p => p.slug === id || p._id === id || p.id === id);
  const [project, setProject] = useState(contextProject || null);
  const [loading, setLoading] = useState(!contextProject && !project);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Synchronously update local project state whenever context projects change (0ms lag!)
  useEffect(() => {
    if (contextProject) {
      setProject(contextProject);
      setLoading(false);
    }
  }, [contextProject]);

  useEffect(() => {
    let isCancelled = false;

    const loadProject = async () => {
      // Only trigger loading UI if we have no project data at all
      if (!contextProject && !project) {
        setLoading(true);
      }
      try {
        const res = await fetch(`${API_BASE}/case-study/${id}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setProject(data);
          }
        } else if (!contextProject) {
          const found = (projects || []).find(p => p.slug === id || p._id === id || p.id === id);
          if (!isCancelled) {
            setProject(found || null);
          }
        }
      } catch (err) {
        console.error("Failed to load case study:", err);
        if (!contextProject && !isCancelled) {
          const found = (projects || []).find(p => p.slug === id || p._id === id || p.id === id);
          setProject(found || null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      isCancelled = true;
    };
  }, [id, contextProject]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loading && !project) {
    return (
      <div className="case-study-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--cs-text-muted)' }}>
          Loading 2026 Case Study...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="case-study-root" style={{ textAlign: 'center', paddingTop: '140px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800' }}>Case Study Not Found</h2>
        <p style={{ color: 'var(--cs-text-secondary)', marginBottom: '24px' }}>The requested portfolio project does not exist.</p>
        <Link to="/projects" className="cs-view-all-btn">
          ← Back to All Projects
        </Link>
      </div>
    );
  }

  if (project.hasCaseStudy === false) {
    const projectLiveUrl = project.links?.liveProject || project.liveUrl;
    return (
      <div className="case-study-root" style={{ textAlign: 'center', paddingTop: '160px', paddingBottom: '120px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Case Study Currently Disabled</h2>
        <p style={{ color: 'var(--cs-text-secondary, #9CA3AF)', maxWidth: '500px', marginBottom: '32px', lineHeight: '1.6' }}>
          Detailed Case Study for <strong>{project.name}</strong> is turned OFF by the site administrator. You can still visit the live project website.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {projectLiveUrl && (
            <a href={projectLiveUrl} target="_blank" rel="noreferrer" className="cs-info-action-btn" style={{ padding: '12px 28px', fontSize: '15px', textDecoration: 'none' }}>
              Visit Live Project ↗
            </a>
          )}
          <Link to="/projects" className="cs-view-all-btn" style={{ padding: '12px 24px', textDecoration: 'none', background: 'var(--admin-card-bg, #1E1F26)', color: '#fff', borderRadius: '10px' }}>
            ← Back to All Projects
          </Link>
        </div>
      </div>
    );
  }

  // Helper to extract image URL from string, object, or array
  const getSingleImageSrc = (primary, secondary, galleryArray) => {
    if (primary && typeof primary === 'string' && primary.trim()) return primary;
    if (primary && typeof primary === 'object' && primary.url) return primary.url;
    if (secondary && typeof secondary === 'string' && secondary.trim()) return secondary;
    if (secondary && typeof secondary === 'object' && secondary.url) return secondary.url;
    if (Array.isArray(galleryArray) && galleryArray.length > 0) {
      const item = galleryArray[0];
      if (typeof item === 'string' && item.trim()) return item;
      if (typeof item === 'object' && item.url) return item.url;
    }
    return '';
  };

  const challengeImgSrc = getSingleImageSrc(project.challengeImage, null, project.challengeImages);
  const solutionImgSrc = getSingleImageSrc(project.solutionImage, null, project.solutionImages);
  const conclusionImgSrc = getSingleImageSrc(project.conclusionImage, project.resultImage, project.resultImages);

  const titleText = project.name || project.title || 'Untitled Case Study';
  const heroImageSrc = project.heroImage || project.bannerImage || project.coverImage || '';
  const taglineText = project.heroConfig?.tagline || project.shortDesc || project.subtitle || '';

  const clientVal = project.client || 'Digital Client';
  const yearVal = project.year || '2026';
  const categoryVal = project.category || 'Product Design';
  const statusVal = project.status || 'Completed';
  const industryVal = project.infoConfig?.industry || 'Digital Product Experience';
  const timelineVal = project.infoConfig?.timeline || '2 - 3 Weeks';
  const roleVal = project.infoConfig?.role || 'Lead UI/UX Designer & Webflow Developer';
  const toolsArray = project.infoConfig?.tools && project.infoConfig.tools.length > 0 
    ? project.infoConfig.tools 
    : (project.technologies && project.technologies.length > 0 ? project.technologies : ['Figma', 'React', 'Framer Motion', 'Webflow']);

  const displayTools = Array.isArray(toolsArray) && toolsArray.length > 0 
    ? toolsArray.join(', ') 
    : (typeof toolsArray === 'string' && toolsArray.trim() ? toolsArray : 'Figma, React, Webflow');

  const liveUrl = project.links?.liveProject || project.liveUrl;
  const githubUrl = project.links?.github || project.githubUrl;
  const figmaUrl = project.links?.figma;

  const handleOpenLightbox = (src) => {
    if (src) setLightboxImg(src);
  };

  const renderFormattedSectionContent = (customText, fallbackIntro, fallbackPoints, fallbackConclusion) => {
    if (customText && customText.trim().length > 0) {
      const lines = customText.split('\n').map(l => l.trim()).filter(Boolean);
      const bulletLines = [];
      const normalParagraphs = [];

      lines.forEach(line => {
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          const cleanText = line.replace(/^[•\-\*]\s*/, '');
          bulletLines.push(cleanText);
        } else {
          normalParagraphs.push(line);
        }
      });

      return (
        <>
          {normalParagraphs.map((para, idx) => (
            <p key={idx} className="cs-body-paragraph">{para}</p>
          ))}

          {bulletLines.length > 0 && (
            <ul className="cs-editorial-disc-list">
              {bulletLines.map((bullet, idx) => {
                const parts = bullet.split(/:\s*(.+)/);
                if (parts.length > 1) {
                  return (
                    <li key={idx}>
                      <strong>{parts[0]}:</strong> {parts[1]}
                    </li>
                  );
                }
                return <li key={idx}>{bullet}</li>;
              })}
            </ul>
          )}
        </>
      );
    }

    return (
      <>
        {fallbackIntro && <p className="cs-body-paragraph">{fallbackIntro}</p>}
        {fallbackPoints && fallbackPoints.length > 0 && (
          <ul className="cs-editorial-disc-list">
            {fallbackPoints.map((item, idx) => (
              <li key={idx}>
                {typeof item === 'string' ? item : (
                  <>
                    <strong>{item.title}:</strong> {item.desc}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {fallbackConclusion && <p className="cs-body-paragraph">{fallbackConclusion}</p>}
      </>
    );
  };

  return (
    <div className="case-study-root" style={{ paddingTop: '120px', paddingBottom: '140px', background: '#FFFFFF', minHeight: '100vh', color: '#111827' }}>
      
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* ── 1. TOP HEADER OVERVIEW BLOCK (Matching Image 2 Top) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px', marginBottom: '64px' }}
        >
          {/* Left Column: Short Description & Neon Green Visit Website Button */}
          <div style={{ flex: '1 1 380px', maxWidth: '460px' }}>
            <p style={{ fontSize: '15px', lineHeight: '1.65', color: '#374151', margin: '0 0 24px 0', fontWeight: '400' }}>
              {project.shortDesc || project.overviewConfig?.intro || `${titleText} is a modern digital product designed to deliver exceptional user experience, high performance, and scalable interface architecture.`}
            </p>

            {liveUrl && (
              <a 
                href={liveUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="cs-visit-website-btn"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6d28d9 100%)', 
                  color: '#ffffff', 
                  fontSize: '14.5px', 
                  fontWeight: '700', 
                  padding: '12px 26px', 
                  borderRadius: '9999px', 
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 14px 36px -6px rgba(139, 92, 246, 0.5), 0 4px 14px rgba(0, 0, 0, 0.1), inset 0 2px 2px 0 rgba(255, 255, 255, 0.95), inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                Visit website <FiExternalLink size={15} />
              </a>
            )}
          </div>

          {/* Right Column: 4-Item Metadata Grid (Category, Services, Client, Date) */}
          <div style={{ flex: '1 1 420px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '24px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>Category</span>
              <strong style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{categoryVal}</strong>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>Services</span>
              <strong style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{roleVal}</strong>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>Client</span>
              <strong style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{clientVal}</strong>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>Date</span>
              <strong style={{ fontSize: '15px', color: '#111827', fontWeight: '600' }}>{yearVal}</strong>
            </div>
          </div>
        </motion.div>

        {/* ── 2. THE CHALLENGE SECTION (Matching Image 2 Section 2) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '64px' }}
        >
          <div style={{ flex: '0 0 160px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', color: '#4B5563', textTransform: 'uppercase' }}>
              THE CHALLENGE
            </span>
          </div>

          <div style={{ flex: '1 1 540px', maxWidth: '680px' }}>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#374151', margin: 0, whiteSpace: 'pre-line' }}>
              {project.challenge || project.challengeIntro || `The client struggled with a complex product that overwhelmed users with dense data and inconsistent layouts. Key insights were buried behind poor hierarchy, unclear navigation, and fragmented components.\n\nAdditionally, the product needed to scale rapidly while maintaining usability.`}
            </p>
          </div>
        </motion.div>

        {/* ── 3. FEATURED LARGE SHOWCASE IMAGE (Matching Image 2 Main Image) ── */}
        {heroImageSrc && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', marginBottom: '40px', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', background: '#F4F4F6' }}
            onClick={() => handleOpenLightbox(heroImageSrc)}
          >
            <img 
              src={getOptimizedImageUrl(heroImageSrc, { width: 1920 })} 
              alt={project.name || titleText} 
              style={{ width: '100%', height: 'auto', maxHeight: '650px', objectFit: 'cover', display: 'block', borderRadius: '12px' }}
            />
          </motion.div>
        )}

        {/* ── 4. DOUBLE MOCKUP GRID (Matching Image 2 Side-by-Side Images) ── */}
        {(challengeImgSrc || solutionImgSrc) && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '64px' }}
          >
            {challengeImgSrc && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', background: '#F4F4F6' }} onClick={() => handleOpenLightbox(challengeImgSrc)}>
                <img 
                  src={getOptimizedImageUrl(challengeImgSrc, { width: 1200 })} 
                  alt="Challenge Mockup" 
                  style={{ width: '100%', height: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block', borderRadius: '12px' }}
                />
              </div>
            )}
            {solutionImgSrc && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', background: '#F4F4F6' }} onClick={() => handleOpenLightbox(solutionImgSrc)}>
                <img 
                  src={getOptimizedImageUrl(solutionImgSrc, { width: 1200 })} 
                  alt="Solution Mockup" 
                  style={{ width: '100%', height: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block', borderRadius: '12px' }}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── 5. FINAL OUTCOME SECTION (Matching Image 2 Bottom Section) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '40px' }}
        >
          <div style={{ flex: '0 0 160px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', color: '#4B5563', textTransform: 'uppercase' }}>
              FINAL OUTCOME
            </span>
          </div>

          <div style={{ flex: '1 1 540px', maxWidth: '680px' }}>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#374151', margin: 0, whiteSpace: 'pre-line' }}>
              {project.results || project.conclusion || `A clear dashboard structure was introduced with consistent components, improved data hierarchy, and simplified navigation patterns that made insights easier to access.\n\nThe new design system reduced design debt, improved usability, and allowed the team to ship new features faster.`}
            </p>
          </div>
        </motion.div>

        {/* Conclusion / Result Image */}
        {conclusionImgSrc && conclusionImgSrc !== heroImageSrc && conclusionImgSrc !== challengeImgSrc && conclusionImgSrc !== solutionImgSrc && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', background: '#F4F4F6' }}
            onClick={() => handleOpenLightbox(conclusionImgSrc)}
          >
            <img 
              src={getOptimizedImageUrl(conclusionImgSrc, { width: 1920 })} 
              alt="Result Mockup" 
              style={{ width: '100%', height: 'auto', maxHeight: '650px', objectFit: 'cover', display: 'block', borderRadius: '12px' }}
            />
          </motion.div>
        )}

      </div>

      {/* ── LIGHTBOX FULLSCREEN MODAL ── */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div 
            className="cs-lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
          >
            <button className="cs-lightbox-close" onClick={() => setLightboxImg(null)}>
              <FiX />
            </button>
            <img src={lightboxImg} alt="Enlarged view" className="cs-lightbox-img" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
