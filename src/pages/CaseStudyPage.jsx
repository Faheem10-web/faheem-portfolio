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
        const res = await fetch(`${API_BASE}/case-study/${id}`);
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

  // Fallback calculations for backward compatibility
  const titleText = project.name || project.title || 'Untitled Case Study';
  const heroImageSrc = project.heroImage || project.bannerImage || project.coverImage || '/assets/project_eco_shades.jpg';
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

  return (
    <div className="case-study-root">
      {/* ── 1. PREMIUM HERO SECTION — Full screen, behind navbar ── */}
      <motion.div 
        className="cs-hero-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="cs-hero-img-container">
          <img 
            src={getOptimizedImageUrl(heroImageSrc, { width: 1920 })} 
            alt={titleText} 
            className="cs-hero-img"
            onError={(e) => { e.target.src = '/assets/project_eco_shades.jpg'; }}
          />
          <div 
            className="cs-hero-overlay" 
            style={{ opacity: project.heroConfig?.overlayOpacity ?? 0.45 }}
          />
          
          <div className="cs-hero-content">
            <div className="cs-hero-title-group">
              <h1 className="cs-hero-dot-title">
                <span className="cs-title-dot" />
                {titleText}
              </h1>
              {taglineText && <p className="cs-hero-tagline">{taglineText}</p>}
            </div>

            <div className="cs-hero-breadcrumb">
              <Link to="/" className="cs-breadcrumb-link">Home</Link>
              <FiChevronRight size={12} />
              <Link to="/projects" className="cs-breadcrumb-link">Work Details</Link>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="case-study-content-wrap">

        <motion.div 
          className="cs-info-grid-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Project Name — leftmost cell */}
          <div className="cs-info-item cs-info-item--name">
            <span className="cs-info-label">Project</span>
            <span className="cs-info-name-text">{titleText}</span>
          </div>

          <div className="cs-info-item">
            <span className="cs-info-label">Client</span>
            <span className="cs-info-value">{clientVal}</span>
          </div>

          <div className="cs-info-item">
            <span className="cs-info-label">Duration</span>
            <span className="cs-info-value">{timelineVal}</span>
          </div>

          <div className="cs-info-item">
            <span className="cs-info-label">Published</span>
            <span className="cs-info-value">{yearVal}</span>
          </div>

          <div className="cs-info-item">
            <span className="cs-info-label">Category</span>
            <span className="cs-info-value">{categoryVal}</span>
          </div>

          {/* Live Preview — rightmost action cell */}
          {liveUrl && (
            <div className="cs-info-item cs-info-item--action">
              <a href={liveUrl} target="_blank" rel="noreferrer" className="cs-info-action-btn">
                Live Preview <FiExternalLink size={13} />
              </a>
            </div>
          )}
        </motion.div>

        {/* ── 3. PROJECT OVERVIEW ── */}
        <motion.section 
          className="cs-editorial-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-section-header">
            <h2 className="cs-section-title">
              {project.overviewConfig?.heading || `${titleText}: Elevating ${industryVal}`}
            </h2>
            
            <p className="cs-body-paragraph">
              <strong>{titleText}</strong> {project.overviewConfig?.intro || "is a premium digital experience platform crafted to bridge the gap between aesthetic inspiration and architectural execution. The objective was to develop a sophisticated, high-performance web experience that showcases luxury spaces while providing an effortless navigation system for potential clients. We implemented a clean, grid-based design language to emphasize visual storytelling and high-resolution imagery."}
            </p>

            <p className="cs-body-paragraph">
              {project.overviewConfig?.secondaryDesc || "The final product delivers a seamless browsing experience tailored for high-end clientele. The result is a refined digital presence that balances artistic expression with functional lead generation."}
            </p>
          </div>
        </motion.section>

        {/* ── 4. EDITORIAL GALLERY (2-COLUMN GRID) ── */}
        <motion.div 
          className="cs-gallery-grid-2" style={{ marginBottom: '64px' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(project.challengeImage || '/assets/mockup_challenge.png')}>
            <img 
              src={getOptimizedImageUrl(project.challengeImage || '/assets/mockup_challenge.png', { width: 1200 })} 
              alt="Challenge Preview" 
              className="cs-mockup-img"
              loading="lazy"
            />
          </div>
          <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(project.solutionImage || '/assets/mockup_solution.png')}>
            <img 
              src={getOptimizedImageUrl(project.solutionImage || '/assets/mockup_solution.png', { width: 1200 })} 
              alt="Solution Preview" 
              className="cs-mockup-img"
              loading="lazy"
            />
          </div>
        </motion.div>

        {/* ── 5. THE CHALLENGE SECTION ── */}
        <motion.section 
          className="cs-editorial-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-section-header">
            <h2 className="cs-section-title">The Challenge</h2>
            
            <p className="cs-body-paragraph">
              {project.challengeIntro || `The primary hurdle for the ${titleText} project was presenting a vast portfolio of diverse design styles without overwhelming the user. We needed to organize complex architectural data into an intuitive interface that maintains a sense of luxury and space.`}
            </p>

            <ul className="cs-editorial-disc-list">
              {(project.challengePoints || [
                "Cluttered navigation is affecting high-end brand perception.",
                "Slow load times for high-resolution gallery assets.",
                "Inconsistent user journeys from inspiration to booking."
              ]).map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>

            <p className="cs-body-paragraph">
              {project.challengeConclusion || "We engineered a lightweight CMS structure that prioritizes performance and clarity. The visual hierarchy was elevated with minimalist UI elements, ensuring that the design work remains the focal point for every visitor."}
            </p>
          </div>

          <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(project.challengeImage || '/assets/mockup_challenge.png')}>
            <img 
              src={getOptimizedImageUrl(project.challengeImage || '/assets/mockup_challenge.png', { width: 1600 })} 
              alt="The Challenge Mockup" 
              className="cs-mockup-img"
              loading="lazy"
            />
          </div>
        </motion.section>

        {/* ── 6. THE SOLUTION SECTION ── */}
        <motion.section 
          className="cs-editorial-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cs-section-header">
            <h2 className="cs-section-title">The Solution</h2>
            
            <p className="cs-body-paragraph">
              {project.solutionIntro || 'Our solution centered on a "Visual-First" philosophy, simplifying the user’s path to discovery through thoughtful interaction design. We created streamlined user flows that make exploring design concepts and scheduling consultations effortless.'}
            </p>

            <ul className="cs-editorial-disc-list">
              {(project.solutionPoints || [
                { title: "Adaptive Masonry Grid", desc: "To showcase projects of varying scales and orientations." },
                { title: "Seamless CMS Integration", desc: "For easy portfolio updates and category filtering." },
                { title: "Interactive Style Quiz", desc: "To guide users toward their preferred aesthetic." },
                { title: "Optimized Performance", desc: "Ensuring 99th percentile load speeds for media-heavy pages." }
              ]).map((item, idx) => (
                <li key={idx}>
                  {typeof item === 'string' ? item : (
                    <>
                      <strong>{item.title}:</strong> {item.desc}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(project.solutionImage || '/assets/mockup_solution.png')}>
            <img 
              src={getOptimizedImageUrl(project.solutionImage || '/assets/mockup_solution.png', { width: 1600 })} 
              alt="The Solution Mockup" 
              className="cs-mockup-img"
              loading="lazy"
            />
          </div>
        </motion.section>

        {/* ── 7. RESEARCH & DESIGN SYSTEM MODULES (IF PRESENT) ── */}
        {project.designSystemConfig?.typography && (
          <motion.section 
            className="cs-editorial-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="cs-section-title">Design System & Architecture</h2>
            <div className="cs-card-grid">
              <div className="cs-feature-card">
                <span className="cs-card-icon">🎨</span>
                <h3 className="cs-card-title">Color Palette</h3>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {(project.designSystemConfig.colors || ['#0A0A0A', '#FFFFFF', '#4F46E5', '#10B981']).map((c, i) => (
                    <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: '1px solid #E5E7EB' }} title={c} />
                  ))}
                </div>
              </div>

              <div className="cs-feature-card">
                <span className="cs-card-icon">🔤</span>
                <h3 className="cs-card-title">Typography System</h3>
                <p className="cs-card-text">{project.designSystemConfig.typography}</p>
              </div>

              <div className="cs-feature-card">
                <span className="cs-card-icon">📐</span>
                <h3 className="cs-card-title">Grid & Spacing</h3>
                <p className="cs-card-text">{project.designSystemConfig.spacing}</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* ── 8. RESULTS & CONCLUSION ── */}
        <motion.section 
          className="cs-editorial-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="cs-section-title">Results & Impact</h2>
          <p className="cs-body-paragraph">
            {project.results || project.conclusion || "The result is a highly optimized, SEO-friendly digital product that exceeds client expectations and performance benchmarks."}
          </p>

          {project.conclusionImage && (
            <div className="cs-mockup-frame" onClick={() => handleOpenLightbox(project.conclusionImage)}>
              <img 
                src={getOptimizedImageUrl(project.conclusionImage, { width: 1600 })} 
                alt="Conclusion Mockup" 
                className="cs-mockup-img"
                loading="lazy"
              />
            </div>
          )}
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
