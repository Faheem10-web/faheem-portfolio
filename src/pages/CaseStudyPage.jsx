import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiExternalLink, FiGithub, FiFigma, FiCheck, 
  FiX, FiChevronRight, FiArrowLeft, FiMaximize2 
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
    : (project.technologies || ['Figma', 'React', 'Framer Motion', 'Webflow']);

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
      {/* ── 1. CUBERTO-STYLE EDITORIAL TYPOGRAPHY HERO (Centered Punto Pago Reference Layout) ── */}
      <motion.section 
        className="cs-typography-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="cs-hero-container">
          
          {/* Top Bar with Back Link */}
          <div className="cs-hero-top-bar">
            <Link to="/projects" className="cs-hero-back-link">
              <FiArrowLeft size={16} /> Back to Work
            </Link>
            <span className="cs-hero-category-label">{categoryVal.toUpperCase()}</span>
          </div>

          {/* Small Centered Project Name (Exact Punto Pago label style) */}
          <motion.div 
            className="cs-hero-small-label"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {titleText}
          </motion.div>

          {/* Massive Centered Editorial Title/Headline (Image 1 "The First Super-App in Latin America" style) */}
          <motion.h1 
            className="cs-hero-editorial-headline"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {taglineText || `${titleText} — Redefining Digital Experience`}
          </motion.h1>



          {/* Centered Bottom Info Grid (Role, Duration, Tools, Year, Live Preview) */}
          <motion.div 
            className="cs-hero-info-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cs-hero-info-cell">
              <span className="cs-info-cell-label">Role</span>
              <span className="cs-info-cell-value">{roleVal}</span>
            </div>

            <div className="cs-hero-info-cell">
              <span className="cs-info-cell-label">Duration</span>
              <span className="cs-info-cell-value">{timelineVal}</span>
            </div>

            <div className="cs-hero-info-cell">
              <span className="cs-info-cell-label">Tools</span>
              <span className="cs-info-cell-value">
                {Array.isArray(toolsArray) ? toolsArray.join(', ') : toolsArray}
              </span>
            </div>

            <div className="cs-hero-info-cell">
              <span className="cs-info-cell-label">Year</span>
              <span className="cs-info-cell-value">{yearVal}</span>
            </div>

            {liveUrl && (
              <div className="cs-hero-info-cell cs-hero-info-cell--action">
                <a href={liveUrl} target="_blank" rel="noreferrer" className="cs-hero-live-btn">
                  Live Preview <FiExternalLink size={14} />
                </a>
              </div>
            )}
          </motion.div>

        </div>
      </motion.section>

      <div className="case-study-content-wrap">

        {/* ── 2. PRIMARY FEATURE SHOWCASE BANNER IMAGE (Full-Width Banner Showcase) ── */}
        {heroImageSrc && (
          <motion.div 
            className="cs-primary-banner-frame"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            onClick={() => handleOpenLightbox(heroImageSrc)}
          >
            <img 
              src={getOptimizedImageUrl(heroImageSrc, { width: 1920 })} 
              alt={titleText} 
              className="cs-primary-banner-img"
            />
          </motion.div>
        )}

        {/* ── 3. SECTION 1: PRODUCT GOALS & OVERVIEW (2-Column Editorial) ── */}
        <motion.section 
          className="cs-editorial-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-block-left">
            <h2 className="cs-block-title">
              {project.overviewConfig?.heading || `Product goals and objectives`}
            </h2>
          </div>
          <div className="cs-block-right">
            <p className="cs-body-paragraph">
              <strong>{titleText}</strong> {project.overviewConfig?.intro || "is a premium digital experience platform crafted to bridge the gap between aesthetic inspiration and architectural execution. The objective was to develop a sophisticated, high-performance web experience that showcases luxury spaces while providing an effortless navigation system for potential clients."}
            </p>
            <p className="cs-body-paragraph">
              {project.overviewConfig?.secondaryDesc || "The final product delivers a seamless browsing experience tailored for high-end clientele. The result is a refined digital presence that balances artistic expression with functional lead generation."}
            </p>
          </div>
        </motion.section>

        {/* ── 4. BENTO MOCKUP GRID SHOWCASE 1 ── */}
        {(project.challengeImage || project.solutionImage) && (
          <motion.div 
            className="cs-bento-grid-2col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {project.challengeImage && (
              <div className="cs-bento-card" onClick={() => handleOpenLightbox(project.challengeImage)}>
                <img 
                  src={getOptimizedImageUrl(project.challengeImage, { width: 1200 })} 
                  alt="Challenge Preview" 
                  className="cs-bento-img"
                  loading="lazy"
                />
              </div>
            )}
            {project.solutionImage && (
              <div className="cs-bento-card" onClick={() => handleOpenLightbox(project.solutionImage)}>
                <img 
                  src={getOptimizedImageUrl(project.solutionImage, { width: 1200 })} 
                  alt="Solution Preview" 
                  className="cs-bento-img"
                  loading="lazy"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── 5. SECTION 2: MULTI-SERVICE PLATFORM & CHALLENGE ── */}
        <motion.section 
          className="cs-editorial-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-block-left">
            <h2 className="cs-block-title">Multi-service platform & challenge</h2>
          </div>
          <div className="cs-block-right">
            {renderFormattedSectionContent(
              project.challenge,
              project.challengeIntro || `The primary hurdle for the ${titleText} project was presenting a vast portfolio of diverse design styles without overwhelming the user. We needed to organize complex architectural data into an intuitive interface that maintains a sense of luxury and space.`,
              project.challengePoints || [
                "Cluttered navigation affecting high-end brand perception.",
                "Slow load times for high-resolution gallery assets.",
                "Inconsistent user journeys from inspiration to conversion."
              ],
              project.challengeConclusion || "We engineered a lightweight CMS structure that prioritizes performance and clarity, ensuring that the design work remains the focal point for every visitor."
            )}
          </div>
        </motion.section>

        {/* ── 6. FULL-WIDTH SHOWCASE BANNER 2 ── */}
        {project.solutionImage && (
          <motion.div 
            className="cs-full-card-banner"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onClick={() => handleOpenLightbox(project.solutionImage)}
          >
            <img 
              src={getOptimizedImageUrl(project.solutionImage, { width: 1600 })} 
              alt="Solution Showcase" 
              className="cs-full-banner-img"
              loading="lazy"
            />
          </motion.div>
        )}

        {/* ── 7. SECTION 3: DEVELOPMENT & SOLUTION ── */}
        <motion.section 
          className="cs-editorial-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-block-left">
            <h2 className="cs-block-title">Development app for Web & Mobile</h2>
          </div>
          <div className="cs-block-right">
            {renderFormattedSectionContent(
              project.solution,
              project.solutionIntro || 'Our solution centered on a "Visual-First" philosophy, simplifying the user’s path to discovery through thoughtful interaction design. We created streamlined user flows that make exploring design concepts effortless.',
              project.solutionPoints || [
                { title: "Adaptive Grid System", desc: "To showcase projects of varying scales and orientations." },
                { title: "Seamless CMS Integration", desc: "For easy portfolio updates and category filtering." },
                { title: "Optimized Performance", desc: "Ensuring 99th percentile load speeds for media-heavy pages." }
              ],
              null
            )}
          </div>
        </motion.section>

        {/* ── 8. SECTION 4: CONTROL PANEL & RESULTS ── */}
        <motion.section 
          className="cs-editorial-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="cs-block-left">
            <h2 className="cs-block-title">Analysis, strategy & impact</h2>
          </div>
          <div className="cs-block-right">
            <p className="cs-body-paragraph">
              {project.results || project.conclusion || "The result is a highly optimized, SEO-friendly digital product that exceeds client expectations and performance benchmarks."}
            </p>
          </div>
        </motion.section>

        {project.conclusionImage && (
          <motion.div 
            className="cs-full-card-banner"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => handleOpenLightbox(project.conclusionImage)}
          >
            <img 
              src={getOptimizedImageUrl(project.conclusionImage, { width: 1600 })} 
              alt="Conclusion Showcase" 
              className="cs-full-banner-img"
              loading="lazy"
            />
          </motion.div>
        )}

        {/* ── 9. NEXT PROJECT TICKER MARQUEE BANNER (Punto Pago Reference Bottom Banner) ── */}
        {otherProjects.length > 0 && (
          <motion.div 
            className="cs-next-project-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="cs-next-project-header">Next Project</div>
            <Link 
              to={`/case-study/${otherProjects[0].slug || otherProjects[0]._id || otherProjects[0].id}`} 
              className="cs-next-project-link"
            >
              <span className="cs-next-project-title">{otherProjects[0].name || otherProjects[0].title}</span>
              <FiChevronRight className="cs-next-project-arrow" />
            </Link>
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
