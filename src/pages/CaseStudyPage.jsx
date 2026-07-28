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
    <div className="case-study-root">
      
      {/* ── 01. EDITORIAL HERO ── */}
      <motion.section 
        className="cs-typography-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="cs-hero-container">
          
          {/* Top Navigation Row */}
          <div className="cs-hero-top-bar">
            <Link to="/projects" className="cs-hero-back-link">
              <FiArrowLeft size={16} /> Back to Work
            </Link>
            <span className="cs-hero-category-label">{categoryVal.toUpperCase()}</span>
          </div>

          {/* Hero Main Editorial Block */}
          <div className="cs-hero-main-block">
            <motion.h1 
              className="cs-hero-editorial-headline"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {taglineText || `${titleText} — Redefining Digital Product Experience`}
            </motion.h1>

            <motion.p 
              className="cs-hero-sub-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {project.shortDesc || project.overviewConfig?.intro || `${titleText} is a premium digital experience platform engineered for high-performance interaction and aesthetic excellence.`}
            </motion.p>
          </div>

          {/* Project Information Card */}
          <motion.div 
            className="cs-hero-card-panel"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Role */}
            <div className="cs-hero-card-col">
              <div className="cs-card-icon-wrapper">
                <FiUser className="cs-card-icon" />
              </div>
              <span className="cs-card-col-label">ROLE</span>
              <span className="cs-card-col-value">{roleVal}</span>
            </div>

            {/* Tools */}
            <div className="cs-hero-card-col">
              <div className="cs-card-icon-wrapper">
                <FiEdit3 className="cs-card-icon" />
              </div>
              <span className="cs-card-col-label">TOOLS</span>
              <span className="cs-card-col-value">{displayTools}</span>
            </div>

            {/* Year */}
            <div className="cs-hero-card-col">
              <div className="cs-card-icon-wrapper">
                <FiClock className="cs-card-icon" />
              </div>
              <span className="cs-card-col-label">YEAR</span>
              <span className="cs-card-col-value">{yearVal}</span>
            </div>

            {/* Live Preview Button */}
            {liveUrl && (
              <div className="cs-hero-card-col cs-hero-card-col--action">
                <a href={liveUrl} target="_blank" rel="noreferrer" className="cs-hero-live-btn">
                  Live Preview <FiExternalLink size={14} />
                </a>
              </div>
            )}
          </motion.div>

        </div>
      </motion.section>

      <div className="case-study-content-wrap">

        {/* ── 02. FULL WIDTH HERO SHOWCASE ── */}
        {heroImageSrc && (
          <motion.div 
            className="cs-featured-banner-wrapper"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src={getOptimizedImageUrl(heroImageSrc, { width: 1920 })} 
              alt={titleText} 
              className="cs-featured-banner-img"
              onClick={() => handleOpenLightbox(heroImageSrc)}
            />
          </motion.div>
        )}

        {/* ── 03. THE CHALLENGE ── */}
        <motion.section 
          className="cs-editorial-split-section"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-split-left-col">
            <span className="cs-split-section-tag">THE CHALLENGE</span>
          </div>

          <div className="cs-split-right-col">
            {renderFormattedSectionContent(
              project.challenge,
              project.challengeIntro || `The primary challenge for ${titleText} was creating an intuitive digital interface that presents complex product variations without sacrificing performance or brand elegance.`,
              project.challengePoints || [
                "Cluttered layout structures impacting high-end brand perception.",
                "Slow asset loading for high-resolution visual collections.",
                "Inconsistent user journeys from initial discovery to checkout conversion."
              ],
              project.challengeConclusion || "We engineered a clean layout architecture prioritizing speed, visual clarity, and seamless user interaction."
            )}

            {/* Action Links */}
            <div className="cs-editorial-links-row">
              {liveUrl && (
                <a href={liveUrl} target="_blank" rel="noreferrer" className="cs-editorial-underlined-link">
                  Launch project ↗
                </a>
              )}
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noreferrer" className="cs-editorial-underlined-link">
                  GitHub Repository
                </a>
              )}
              {figmaUrl && (
                <a href={figmaUrl} target="_blank" rel="noreferrer" className="cs-editorial-underlined-link">
                  Figma Prototype
                </a>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── 04. LARGE SHOWCASE IMAGE ── */}
        {challengeImgSrc && (
          <motion.div 
            className="cs-large-showcase-wrapper"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(challengeImgSrc)}>
              <img 
                src={getOptimizedImageUrl(challengeImgSrc, { width: 1600 })} 
                alt="Challenge Showcase" 
                className="cs-mockup-img"
                loading="lazy"
              />
            </div>
          </motion.div>
        )}

        {/* ── 05. THE SOLUTION ── */}
        <motion.section 
          className="cs-editorial-split-section"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-split-left-col">
            <span className="cs-split-section-tag">THE SOLUTION</span>
          </div>

          <div className="cs-split-right-col">
            {renderFormattedSectionContent(
              project.solution,
              project.solutionIntro || 'Our solution centered on a "Visual-First" design philosophy, establishing clean interaction paths and adaptive component hierarchies.',
              project.solutionPoints || [
                { title: "Adaptive Grid Layouts", desc: "Showcasing products with high visual impact." },
                { title: "Optimized Performance", desc: "Ensuring 99th percentile load speeds for rich media." },
                { title: "Seamless Navigation", desc: "Guiding users effortlessly toward conversion." }
              ],
              null
            )}
          </div>
        </motion.section>

        {/* ── 06. FULL WIDTH MOCKUP ── */}
        {solutionImgSrc && (
          <motion.div 
            className="cs-full-width-mockup-wrapper"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(solutionImgSrc)}>
              <img 
                src={getOptimizedImageUrl(solutionImgSrc, { width: 1920 })} 
                alt="Full Width Solution Mockup" 
                className="cs-mockup-img"
                loading="lazy"
              />
            </div>
          </motion.div>
        )}

        {/* ── 07. PRODUCT GALLERY (Alternating Grid Layout) ── */}
        {Array.isArray(project.gallery) && project.gallery.length > 0 && (
          <motion.section 
            className="cs-product-gallery-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="cs-gallery-header">
              <span className="cs-split-section-tag">VISUAL GALLERY</span>
            </div>
            <div className="cs-alternating-gallery-grid">
              {project.gallery.map((imgItem, idx) => {
                const imgUrl = typeof imgItem === 'string' ? imgItem : imgItem?.url;
                if (!imgUrl) return null;
                const isLarge = idx % 3 === 0;
                return (
                  <div 
                    key={idx} 
                    className={`cs-gallery-item ${isLarge ? 'cs-gallery-item--large' : 'cs-gallery-item--half'}`}
                    onClick={() => handleOpenLightbox(imgUrl)}
                  >
                    <img 
                      src={getOptimizedImageUrl(imgUrl, { width: isLarge ? 1600 : 1000 })} 
                      alt={`Gallery ${idx + 1}`} 
                      className="cs-gallery-img"
                      loading="lazy"
                    />
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── 08. RESPONSIVE EXPERIENCE ── */}
        <motion.section 
          className="cs-responsive-experience-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="cs-split-left-col">
            <span className="cs-split-section-tag">RESPONSIVE DESIGN</span>
          </div>
          <div className="cs-split-right-col">
            <p className="cs-body-paragraph">
              Engineered with fluid responsiveness across desktop, tablet, and mobile touch surfaces for flawless usability at any viewport width.
            </p>
            <div className="cs-responsive-badges-row">
              <span className="cs-responsive-badge">💻 Desktop (1920px+)</span>
              <span className="cs-responsive-badge">📱 Tablet (768px)</span>
              <span className="cs-responsive-badge">📲 Mobile (320px)</span>
            </div>
          </div>
        </motion.section>

        {/* ── 09. FINAL OUTCOME ── */}
        <motion.section 
          className="cs-editorial-split-section"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-split-left-col">
            <span className="cs-split-section-tag">FINAL OUTCOME</span>
          </div>

          <div className="cs-split-right-col">
            <p className="cs-body-paragraph">
              {project.results || project.conclusion || "The result is a highly optimized, SEO-friendly digital product that exceeds performance benchmarks and delivers an extraordinary user experience."}
            </p>

            {conclusionImgSrc && (
              <div className="cs-mockup-frame" style={{ marginTop: '32px' }} onClick={() => handleOpenLightbox(conclusionImgSrc)}>
                <img 
                  src={getOptimizedImageUrl(conclusionImgSrc, { width: 1600 })} 
                  alt="Final Outcome Showcase" 
                  className="cs-mockup-img"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </motion.section>

        {/* ── 10. NEXT PROJECT ── */}
        {(() => {
          const nextProject = (projects || []).find(p => (p.slug !== id && p._id !== id && p.enabled !== false));
          if (!nextProject) return null;
          const nextSlug = nextProject.slug || nextProject._id;
          const nextTitle = nextProject.name || 'Next Case Study';
          const nextCategory = nextProject.category || 'Featured Work';

          return (
            <motion.div 
              className="cs-next-project-footer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Link to={`/projects/${nextSlug}`} className="cs-next-project-card">
                <span className="cs-next-project-label">NEXT PROJECT ↗</span>
                <h3 className="cs-next-project-title">{nextTitle}</h3>
                <span className="cs-next-project-category">{nextCategory}</span>
              </Link>
            </motion.div>
          );
        })()}

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
