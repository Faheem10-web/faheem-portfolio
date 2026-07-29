import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./CaseStudyPage.css";
import { 
  FiExternalLink, FiGithub, FiFigma, FiCheck, 
  FiX, FiChevronRight, FiChevronLeft, FiArrowLeft, FiMaximize2,
  FiUser, FiCalendar, FiEdit3, FiClock
} from "react-icons/fi";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config/api";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";

function MockupSliderCard({ images = [], onOpenLightbox }) {
  const validImages = images.filter(img => typeof img === 'string' && img.trim().length > 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (validImages.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [validImages.length, isHovered]);

  if (validImages.length === 0) return null;

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '340px',
        aspectRatio: '16 / 9',
        borderRadius: '16px', 
        overflow: 'hidden', 
        background: '#F4F4F6',
        cursor: 'pointer',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        marginBottom: '56px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenLightbox(validImages[currentIndex])}
    >
      <AnimatePresence>
        <motion.img
          key={currentIndex}
          src={getOptimizedImageUrl(validImages[currentIndex], { width: 1920 })}
          alt={`Mockup Slide ${currentIndex + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            display: 'block', 
            borderRadius: '16px' 
          }}
        />
      </AnimatePresence>

      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            style={{
              position: 'absolute',
              top: '50%',
              left: '16px',
              transform: 'translateY(-50%)',
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <FiChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            style={{
              position: 'absolute',
              top: '50%',
              right: '16px',
              transform: 'translateY(-50%)',
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <FiChevronRight size={22} />
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(17, 24, 39, 0.65)',
              backdropFilter: 'blur(10px)',
              padding: '6px 14px',
              borderRadius: '20px',
              zIndex: 10
            }}
          >
            {validImages.map((_, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                style={{
                  width: idx === currentIndex ? '22px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentIndex ? '#00E676' : 'rgba(255, 255, 255, 0.45)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CaseStudyPage() {
  const { id } = useParams();
  const { projects } = useAdmin();
  
  const contextProject = (projects || []).find(p => p.slug === id || p._id === id || p.id === id);
  const [project, setProject] = useState(contextProject || null);
  const [loading, setLoading] = useState(!contextProject && !project);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    if (contextProject) {
      setProject(contextProject);
      setLoading(false);
    }
  }, [contextProject]);

  useEffect(() => {
    let isCancelled = false;

    const loadProject = async () => {
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
    return () => { isCancelled = true; };
  }, [id, contextProject, projects]);

  const handleOpenLightbox = (imgUrl) => {
    if (imgUrl) {
      setLightboxImg(imgUrl);
    }
  };

  if (loading && !project) {
    return (
      <div className="case-study-root" style={{ textAlign: 'center', paddingTop: '160px', minHeight: '80vh' }}>
        <div className="cs-loading-spinner" style={{ margin: '0 auto 20px' }}></div>
        <p style={{ color: 'var(--cs-text-secondary, #9CA3AF)', fontSize: '15px' }}>Loading case study experience...</p>
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

  const titleText = project.name || project.title || 'Untitled Case Study';
  const taglineText = project.heroConfig?.tagline || project.shortDesc || project.subtitle || '';

  const clientVal = project.client || 'Digital Client';
  const yearVal = project.year || '2026';
  const categoryVal = project.category || 'Product Design';
  const roleVal = project.infoConfig?.role || 'Lead UI/UX Designer & Webflow Developer';

  const liveUrl = project.links?.liveProject || project.liveUrl;

  const getArrayFromImages = (primary, secondary, arr) => {
    const list = [];
    if (primary && typeof primary === 'string' && primary.trim()) list.push(primary);
    if (primary && typeof primary === 'object' && primary.url) list.push(primary.url);
    if (secondary && typeof secondary === 'string' && secondary.trim()) list.push(secondary);
    if (secondary && typeof secondary === 'object' && secondary.url) list.push(secondary.url);
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (typeof item === 'string' && item.trim()) list.push(item);
        if (typeof item === 'object' && item.url) list.push(item.url);
      });
    }
    return Array.from(new Set(list.filter(Boolean)));
  };

  const getCloudinaryPublicId = (url) => {
    if (!url || typeof url !== 'string') return '';
    let clean = url.split('?')[0];
    clean = clean.replace(/^(https?:)?\/\//, '');
    const match = clean.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
    if (match && match[1]) {
      return match[1].replace(/\.[^/.]+$/, "");
    }
    return clean;
  };

  const isDuplicateImage = (url, list) => {
    if (!url) return false;
    const targetId = getCloudinaryPublicId(url);
    return list.some(item => getCloudinaryPublicId(item) === targetId);
  };

  const getCromicMobileScreens = () => {
    const defaultCromicScreens = [
      "https://i.pinimg.com/736x/5a/c5/1a/5ac51a73d86fdfcde5935a8f9a521c10.jpg",
      "https://i.pinimg.com/736x/72/c9/61/72c9617c4e77a7aede5c69a75fa753d6.jpg"
    ];
    
    if (project.showcaseConfig?.mobileScreens?.length > 0) {
      const cmsScreens = project.showcaseConfig.mobileScreens.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
      if (cmsScreens.length >= 2) return cmsScreens.slice(0, 2);
      if (cmsScreens.length > 0) {
        return [cmsScreens[0], defaultCromicScreens[1]];
      }
    }
    
    return defaultCromicScreens;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  const phoneVariants = (delay) => ({
    hidden: { opacity: 0, y: 60, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 70, 
        damping: 16, 
        delay,
        opacity: { duration: 0.6 },
        y: { type: "spring", stiffness: 70, damping: 16 }
      }
    }
  });

  // Card 1 Slider (Top Main Cover Showcase Card)
  // STRICT: Uses ONLY hero/banner images. No fallback to coverImage unless no hero/banner images exist.
  const card1RawList = getArrayFromImages(
    project.heroImage || project.bannerImage, 
    null, 
    project.heroImages
  );
  // If no explicit hero images exist, fall back to coverImage
  const card1SliderImages = card1RawList.length > 0 
    ? card1RawList 
    : (project.coverImage ? [getSingleImageSrc(project.coverImage, null, null)] : []);

  // Card 2 Slider (Middle Featured Showcase Card below THE CHALLENGE)
  // STRICT: Uses ONLY challenge and solution images from the CMS.
  const card2RawImages = getArrayFromImages(
    project.challengeImage || project.solutionImage, 
    null, 
    [...(project.challengeImages || []), ...(project.solutionImages || [])]
  );
  const card2SliderImages = card2RawImages.filter(img => 
    img && typeof img === 'string' && img.trim() && !isDuplicateImage(img, card1SliderImages)
  );

  // Card 3 Slider (Bottom Outcome Showcase Card below FINAL OUTCOME)
  // STRICT: Uses ONLY result and conclusion images from the CMS.
  const card3RawImages = getArrayFromImages(
    project.resultImage || project.conclusionImage, 
    null, 
    [...(project.resultImages || []), ...(project.conclusionImages || [])]
  );
  const card3SliderImages = card3RawImages.filter(img => 
    img && typeof img === 'string' && img.trim() && !isDuplicateImage(img, card1SliderImages) && !isDuplicateImage(img, card2SliderImages)
  );

  return (
    <div className="case-study-root" style={{ paddingTop: '120px', paddingBottom: '140px', background: '#FFFFFF', minHeight: '100vh', color: '#111827' }}>
      
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* ── 1. CENTERED PROJECT TITLE ── */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
              fontSize: 'clamp(36px, 5.5vw, 64px)', 
              fontWeight: '700', 
              color: '#0D0D0D', 
              letterSpacing: '-0.03em',
              lineHeight: '1.1',
              margin: 0
            }}
          >
            {project.name || titleText}
          </motion.h1>
        </div>

        {/* ── 2. CARD 1 SLIDER (Top Main Cover Showcase Card) ── */}
        {card1SliderImages.length > 0 && (
          <MockupSliderCard images={card1SliderImages} onOpenLightbox={handleOpenLightbox} />
        )}

        {/* ── 3. OVERVIEW BLOCK ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px', marginBottom: '56px' }}
        >
          {/* Left Column: Short Description & Purple Glossy Visit Website Button */}
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

        {/* ── 4. THE CHALLENGE SECTION ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '56px' }}
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

        {/* ── 5. CARD 2 SLIDER (Middle Featured Showcase Card) ── */}
        {card2SliderImages.length > 0 && (
          <MockupSliderCard images={card2SliderImages} onOpenLightbox={handleOpenLightbox} />
        )}

        {/* ── MOBILE EXPERIENCE SECTION (CROMIC EXCLUSIVE) ── */}
        {(project.slug === 'projects' || project.name?.toLowerCase() === 'cromic') && (
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px" }}
            variants={containerVariants}
            className="cs-mobile-experience-section"
          >
            {/* Centered Heading */}
            <div className="cs-mobile-exp-header">
              <motion.span variants={fadeUpVariants} className="cs-mobile-exp-label">
                RESPONSIVE EXPERIENCE
              </motion.span>
              <motion.h2 variants={fadeUpVariants} className="cs-mobile-exp-title">
                MOBILE EXPERIENCE
              </motion.h2>
            </div>

            {/* Right Column: Two premium same-height cards matching user provided images */}
            <div className="cs-mobile-exp-right">
              {/* Card 1 */}
              {getCromicMobileScreens()[0] && (
                <motion.div
                  variants={phoneVariants(0.1)}
                  className="cs-mobile-card"
                >
                  <img 
                    src={getCromicMobileScreens()[0]} 
                    alt="Mobile Experience Card 1" 
                  />
                </motion.div>
              )}

              {/* Card 2 */}
              {getCromicMobileScreens()[1] && (
                <motion.div
                  variants={phoneVariants(0.25)}
                  className="cs-mobile-card"
                >
                  <img 
                    src={getCromicMobileScreens()[1]} 
                    alt="Mobile Experience Card 2" 
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── 6. FINAL OUTCOME SECTION ── */}
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

        {/* ── 7. CARD 3 SLIDER (Bottom Outcome Showcase Card) ── */}
        {card3SliderImages.length > 0 && (
          <MockupSliderCard images={card3SliderImages} onOpenLightbox={handleOpenLightbox} />
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
