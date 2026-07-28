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
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/case-study/${id}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        } else {
          const found = (projects || []).find(p => p.slug === id || p._id === id || p.id === id);
          setProject(found || null);
        }
      } catch (err) {
        console.error("Failed to load case study:", err);
        const found = (projects || []).find(p => p.slug === id || p._id === id || p.id === id);
        setProject(found || null);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, projects]);

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

  // Fallback calculations for backward compatibility
  const titleText = project.name || project.title || 'Untitled Case Study';
  const heroImageSrc = project.heroImage || project.bannerImage || project.coverImage || '';
  const taglineText = project.heroConfig?.tagline || project.shortDesc || project.subtitle || '';
  const breadcrumbText = project.heroConfig?.breadcrumb || `Home / Work Details / ${titleText}`;

  // Info Config
  const clientVal = project.client || 'Digital Client';
  const yearVal = project.year || '2026';
  const categoryVal = project.category || 'Product Design';
  const statusVal = project.status || 'Completed';
  const industryVal = project.infoConfig?.industry || 'Digital Product Experience';
  const timelineVal = project.infoConfig?.timeline || '2 - 3 Weeks';
  const roleVal = project.infoConfig?.role || 'Lead UI/UX Designer & Webflow Developer';
  const teamVal = project.infoConfig?.team || 'Solo Design & Engineering';
  const platformVal = project.infoConfig?.platform || 'Web & Mobile';
  const toolsArray = project.infoConfig?.tools && project.infoConfig.tools.length > 0 
    ? project.infoConfig.tools 
    : (project.technologies && project.technologies.length > 0 ? project.technologies : ['Figma', 'React', 'Framer Motion', 'Webflow']);

  const displayTools = Array.isArray(toolsArray) && toolsArray.length > 0 
    ? toolsArray.join(', ') 
    : (typeof toolsArray === 'string' && toolsArray.trim() ? toolsArray : 'Figma, React, Webflow');

  const liveUrl = project.links?.liveProject || project.liveUrl;
  const githubUrl = project.links?.github || project.githubUrl;
  const figmaUrl = project.links?.figma;
  const prototypeUrl = project.links?.prototype;

  // Other Projects for "More Works"
  const otherProjects = (projects || [])
    .filter(p => (p.slug !== id && p._id !== id && p.enabled !== false))
    .slice(0, 2);

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
      {/* ── 1. PREMIUM 2026 EDITORIAL HERO CARD (Exact Mockup Match) ── */}
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


            {/* Massive Editorial Headline */}
            <motion.h1 
              className="cs-hero-editorial-headline"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {taglineText || `${titleText} — Redefining Digital Product Experience`}
            </motion.h1>

            {/* Short Sub-Description */}
            <motion.p 
              className="cs-hero-sub-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {project.shortDesc || project.overviewConfig?.intro || `${titleText} is a revolutionary digital experience platform that brings essential services into one seamless interface.`}
            </motion.p>
          </div>

          {/* 4-Metric Floating Card Container */}
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
            {/* Live Link (Far Right inside Box) */}
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

        {/* ── 2. FULL-WIDTH FEATURED BANNER IMAGE (Matching Image 1) ── */}
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

        {/* ── 3. THE CHALLENGE / OVERVIEW (2-Column Editorial Layout matching Image 1) ── */}
        <motion.section 
          className="cs-editorial-split-section"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Left Column: Section Title (THE CHALLENGE) */}
          <div className="cs-split-left-col">
            <span className="cs-split-section-tag">THE CHALLENGE</span>
          </div>

          {/* Right Column: Paragraph Content & Underlined Action Links */}
          <div className="cs-split-right-col">
            {renderFormattedSectionContent(
              project.challenge,
              project.challengeIntro || `For several years we've been helping ${titleText} explore new digital product niches. During this time we worked from establishing core utility flows to launching an integrated digital product ecosystem with high-performance UI architecture.`,
              project.challengePoints || [
                "Cluttered navigation affecting user engagement and brand perception.",
                "Slow load times for high-resolution visual gallery assets.",
                "Inconsistent user journeys from initial discovery to conversion."
              ],
              project.challengeConclusion || "We engineered a lightweight CMS structure that prioritizes performance and clarity, ensuring that the design work remains the focal point for every visitor."
            )}

            {/* Underlined Action Links Row (Matching Image 1) */}
            <div className="cs-editorial-links-row">
              {liveUrl && (
                <a href={liveUrl} target="_blank" rel="noreferrer" className="cs-editorial-underlined-link">
                  Launch project
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

        {/* ── 4. EDITORIAL GALLERY (2-COLUMN GRID) ── */}
        {(project.challengeImage || project.solutionImage) && (
          <motion.div 
            className="cs-double-mockup-grid"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {project.challengeImage && (
              <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(project.challengeImage)}>
                <img 
                  src={getOptimizedImageUrl(project.challengeImage, { width: 1200 })} 
                  alt="Challenge Preview" 
                  className="cs-mockup-img"
                  loading="lazy"
                />
              </div>
            )}
            {project.solutionImage && (
              <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(project.solutionImage)}>
                <img 
                  src={getOptimizedImageUrl(project.solutionImage, { width: 1200 })} 
                  alt="Solution Preview" 
                  className="cs-mockup-img"
                  loading="lazy"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── 5. THE SOLUTION SECTION (2-Column Editorial Layout) ── */}
        <motion.section 
          className="cs-editorial-split-section"
          initial={{ opacity: 0, y: 20 }}
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
              project.solutionIntro || 'Our solution centered on a "Visual-First" philosophy, simplifying the user’s path to discovery through thoughtful interaction design. We created streamlined user flows that make exploring design concepts and scheduling consultations effortless.',
              project.solutionPoints || [
                { title: "Adaptive Masonry Grid", desc: "To showcase projects of varying scales and orientations." },
                { title: "Seamless CMS Integration", desc: "For easy portfolio updates and category filtering." },
                { title: "Interactive Style Quiz", desc: "To guide users toward their preferred aesthetic." },
                { title: "Optimized Performance", desc: "Ensuring 99th percentile load speeds for media-heavy pages." }
              ],
              null
            )}
          </div>
        </motion.section>

        {/* ── 6. RESULTS & IMPACT SECTION ── */}
        <motion.section 
          className="cs-editorial-split-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="cs-split-left-col">
            <span className="cs-split-section-tag">RESULTS & IMPACT</span>
          </div>

          <div className="cs-split-right-col">
            <p className="cs-body-paragraph">
              {project.results || project.conclusion || "The result is a highly optimized, SEO-friendly digital product that exceeds client expectations and performance benchmarks."}
            </p>

            {project.conclusionImage && (
              <div className="cs-mockup-frame" style={{ marginTop: '24px' }} onClick={() => handleOpenLightbox(project.conclusionImage)}>
                <img 
                  src={getOptimizedImageUrl(project.conclusionImage, { width: 1600 })} 
                  alt="Conclusion Mockup" 
                  className="cs-mockup-img"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </motion.section>
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
