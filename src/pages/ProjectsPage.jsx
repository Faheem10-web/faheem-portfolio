import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ProjectsPage.css";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiArrowRight, 
    FiExternalLink
} from "react-icons/fi";
import { useAdmin } from "../context/AdminContext";
import { getOptimizedImageUrl, getSrcSet } from "../utils/imageOptimizer";
import LazyImage from "../components/common/LazyImage";

const formatExternalUrl = (url) => {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (!trimmed) return '#';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

// Refactored Subcomponent for Project Card to handle direct mouse follow
function ProjectCard({ project, index, cardLink, coverImg, cardTitle, demoLink }) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);
    const buttonsRef = useRef(null);
    const hasCaseStudy = project.hasCaseStudy !== false;

    const resetState = useCallback(() => {
        setIsHovered(false);
        if (buttonsRef.current) {
            buttonsRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        }
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }, []);

    useEffect(() => {
        const handleFocusReturn = () => {
            resetState();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                resetState();
            }
        };

        window.addEventListener('focus', handleFocusReturn);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pageshow', handleFocusReturn);

        return () => {
            window.removeEventListener('focus', handleFocusReturn);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handleFocusReturn);
        };
    }, [resetState]);

    const handleMouseMove = (e) => {
        if (!buttonsRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Calculate offset from center in range [-0.5, 0.5]
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        // Max translation 3px (Subtle 2-3px offset)
        const tx = x * 6; 
        const ty = y * 6; 
        
        buttonsRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        if (!isHovered) setIsHovered(true);
    };

    const optimizedCover = getOptimizedImageUrl(coverImg, { width: 800 });
    const coverSrcSet = getSrcSet(coverImg, [400, 600, 800, 1200]);

    const handleSaveScrollPos = () => {
        try {
            sessionStorage.setItem('projects_scroll_pos', window.scrollY.toString());
        } catch {
            // fallback
        }
        resetState();
    };

    return (
        <motion.div
            ref={cardRef}
            layout
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className={`proj-card-box ${isHovered ? 'is-hovered' : 'is-idle'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetState}
            onPointerLeave={resetState}
            onBlur={resetState}
        >
            <div className="proj-card-inner" tabIndex="0">
                <div className="proj-card-image-wrap">
                    {optimizedCover ? (
                        <LazyImage 
                            src={optimizedCover} 
                            srcSet={coverSrcSet}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                            priority={index < 2}
                            alt={cardTitle} 
                            className="proj-card-image" 
                        />
                    ) : (
                        <div className="proj-card-image-placeholder" style={{ width: '100%', height: '100%', background: 'var(--admin-card-bg, #1a1b23)' }} />
                    )}
                    
                    {/* Premium Glass Overlay & Centered Buttons */}
                    {(hasCaseStudy || demoLink) && (
                        <div className="proj-card-hover-overlay">
                            <div className="proj-card-hover-buttons" ref={buttonsRef}>
                                {project.viewDesignOnly ? (
                                    hasCaseStudy ? (
                                        <Link 
                                            to={cardLink} 
                                            className="hover-btn hover-btn-purple"
                                            onClick={handleSaveScrollPos}
                                        >
                                            <span>View Design</span>
                                            <FiExternalLink />
                                        </Link>
                                    ) : (
                                        <a 
                                            href={formatExternalUrl(demoLink)} 
                                            className="hover-btn hover-btn-purple" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                resetState();
                                            }}
                                        >
                                            <span>View Design</span>
                                            <FiExternalLink />
                                        </a>
                                    )
                                ) : (
                                    <>
                                        {hasCaseStudy && (
                                            <Link 
                                                to={cardLink} 
                                                className={`hover-btn ${demoLink ? 'hover-btn-glass' : 'hover-btn-purple'}`}
                                                onClick={handleSaveScrollPos}
                                            >
                                                Case Study
                                            </Link>
                                        )}
                                        {demoLink && (
                                            <a 
                                                href={formatExternalUrl(demoLink)} 
                                                className="hover-btn hover-btn-purple" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    resetState();
                                                }}
                                            >
                                                <span>Live Preview</span>
                                                <FiExternalLink />
                                            </a>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="proj-card-meta">
                    <div className="meta-top">
                        <span className="meta-category">{project.category}</span>
                    </div>
                    <h3 className="meta-title">{cardTitle}</h3>
                    
                    <div className="proj-card-actions">
                        {project.viewDesignOnly ? (
                            hasCaseStudy ? (
                                <Link to={cardLink} className="action-btn action-primary" onClick={handleSaveScrollPos}>
                                    <span>View Design</span>
                                    <FiArrowRight />
                                </Link>
                            ) : (
                                demoLink && (
                                    <a 
                                        href={formatExternalUrl(demoLink)} 
                                        className="action-btn action-primary" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resetState();
                                        }}
                                    >
                                        <span>View Design</span>
                                        <FiExternalLink />
                                    </a>
                                )
                            )
                        ) : (
                            <>
                                {hasCaseStudy ? (
                                    <Link to={cardLink} className="action-btn action-primary" onClick={handleSaveScrollPos}>
                                        <span>Case Study</span>
                                        <FiArrowRight />
                                    </Link>
                                ) : (
                                    demoLink && (
                                        <a 
                                            href={formatExternalUrl(demoLink)} 
                                            className="action-btn action-primary" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span>Live Preview</span>
                                            <FiExternalLink />
                                        </a>
                                    )
                                )}
                                {hasCaseStudy && demoLink && (
                                    <a 
                                        href={formatExternalUrl(demoLink)} 
                                        className="action-btn action-secondary" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FiExternalLink />
                                        <span>Live Preview</span>
                                    </a>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ProjectsPage() {
    const { projects, isProjectsLoading } = useAdmin();
    
    const activeProjects = (projects || [])
        .filter(p => p && p.enabled !== false)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    const showSkeleton = isProjectsLoading && activeProjects.length === 0;

    useEffect(() => {
        let savedPos = null;
        try {
            savedPos = sessionStorage.getItem('projects_scroll_pos');
        } catch {
            savedPos = null;
        }

        if (savedPos !== null) {
            const scrollY = parseInt(savedPos, 10) || 0;
            try {
                sessionStorage.removeItem('projects_scroll_pos');
            } catch {
                // fallback
            }

            const timer = setTimeout(() => {
                window.scrollTo(0, scrollY);
                document.documentElement.scrollTop = scrollY;
                document.body.scrollTop = scrollY;
                if (window.lenis) {
                    window.lenis.scrollTo(scrollY, { immediate: true });
                }
            }, 60);

            return () => clearTimeout(timer);
        } else {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            if (window.lenis) {
                window.lenis.scrollTo(0, { immediate: true });
            }
        }
    }, []);

    if (showSkeleton) {
        return (
            <div className="projects-page-wrapper">
                <div className="proj-page-heading-wrap">
                    <h1 className="proj-page-heading skeleton-text shimmer-placeholder" style={{ width: '300px', height: '48px', margin: '0 auto' }}></h1>
                </div>
                <section className="proj-grid-section">
                    <div className="proj-grid-container">
                        <div className="proj-grid">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div className="proj-card-box" key={n}>
                                    <div className="proj-card-inner shimmer-placeholder" style={{ height: '360px', borderRadius: '24px' }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    if (activeProjects.length === 0) {
        return (
            <div className="projects-page-wrapper">
                <div className="proj-page-heading-wrap">
                    <h1 className="proj-page-heading">
                        Selected <span>Projects</span>
                    </h1>
                </div>
                <section className="proj-grid-section">
                    <div className="proj-grid-container" style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.6)' }}>
                        <p style={{ fontSize: '18px', fontWeight: '500' }}>No projects found in database.</p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="projects-page-wrapper">
            
            {/* PAGE HEADING */}
            <div className="proj-page-heading-wrap">
                <motion.h1
                    className="proj-page-heading"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    Selected <span>Projects</span>
                </motion.h1>
            </div>

            {/* 3. PREMIUM PROJECT GRID */}
            <section className="proj-grid-section">
                <div className="proj-grid-container">
                    <motion.div 
                        className="proj-grid"
                        layout
                    >
                        <AnimatePresence mode="popLayout">
                            {activeProjects.map((project, index) => {
                                const cardLink = project.slug ? `/case-study/${project.slug}` : `/case-study/${project._id || project.id}`;
                                const coverImg = project.coverImage || project.image;
                                const cardTitle = project.name || project.title;
                                const demoLink = project.liveUrl || project.demoLink;

                                return (
                                    <ProjectCard
                                        key={project._id || project.id}
                                        project={project}
                                        index={index}
                                        cardLink={cardLink}
                                        coverImg={coverImg}
                                        cardTitle={cardTitle}
                                        demoLink={demoLink}
                                    />
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}

export default ProjectsPage;
