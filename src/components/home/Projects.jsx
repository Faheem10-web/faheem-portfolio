import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import "./Projects.css";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext";
import { getOptimizedImageUrl, getSrcSet } from "../../utils/imageOptimizer";
import LazyImage from "../common/LazyImage";

const MotionLink = motion(Link);

const formatExternalUrl = (url) => {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (!trimmed) return '#';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

// Refactored Subcomponent for Home Page Project Card to handle direct mouse follow via RAF
const ProjectCard = memo(function ProjectCard({ project, index, cardLink, coverImg, cardTitle, navigate }) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);
    const buttonsRef = useRef(null);
    const rectRef = useRef(null);
    const rafRef = useRef(null);
    const hasCaseStudy = project.hasCaseStudy !== false;

    const resetState = useCallback(() => {
        setIsHovered(false);
        rectRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
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

    const handleMouseEnter = (e) => {
        rectRef.current = e.currentTarget.getBoundingClientRect();
        setIsHovered(true);
    };

    const handleMouseMove = (e) => {
        if (!buttonsRef.current) return;
        if (!rectRef.current) {
            rectRef.current = e.currentTarget.getBoundingClientRect();
        }
        const rect = rectRef.current;
        if (!rect || !rect.width || !rect.height) return;
        
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (!buttonsRef.current) return;
            const x = (clientX - rect.left) / rect.width - 0.5;
            const y = (clientY - rect.top) / rect.height - 0.5;
            const tx = x * 6; 
            const ty = y * 6; 
            buttonsRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });
        if (!isHovered) setIsHovered(true);
    };

    const optimizedCover = getOptimizedImageUrl(coverImg, { width: 800 });
    const coverSrcSet = getSrcSet(coverImg, [400, 600, 800, 1200]);

    const handleCardClick = useCallback((e) => {
        if (!e.target.closest('a') && !e.target.closest('button')) {
            if (hasCaseStudy) {
                navigate(cardLink);
            } else if (project.liveUrl) {
                const formatted = formatExternalUrl(project.liveUrl);
                if (formatted !== '#') {
                    window.open(formatted, '_blank', 'noopener,noreferrer');
                }
            }
        }
    }, [hasCaseStudy, navigate, cardLink, project.liveUrl]);

    return (
        <motion.div
            ref={cardRef}
            className={`project-card-wrapper ${isHovered ? 'is-hovered' : 'is-idle'}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
            onClick={handleCardClick}
            style={{ cursor: hasCaseStudy || project.liveUrl ? 'pointer' : 'default' }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetState}
            onPointerLeave={resetState}
        >
            <div className="project-card" tabIndex="0">
                {optimizedCover ? (
                    <LazyImage 
                        src={optimizedCover} 
                        srcSet={coverSrcSet}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                        priority={index < 2}
                        alt={cardTitle} 
                        className="project-image" 
                        aspectRatio="16/10"
                    />
                ) : (
                    <div className="project-image-placeholder" style={{ width: '100%', height: '100%', background: 'var(--admin-card-bg, #1a1b23)', aspectRatio: '16/10' }} />
                )}
                {(hasCaseStudy || project.liveUrl) && (
                    <div className="project-overlay">
                        <div className="project-hover-actions" ref={buttonsRef}>
                            {project.viewDesignOnly ? (
                                hasCaseStudy ? (
                                    <Link 
                                        to={cardLink} 
                                        className="project-hover-btn project-hover-btn--primary"
                                        onClick={resetState}
                                    >
                                        <span>View Design</span>
                                        <FiExternalLink />
                                    </Link>
                                ) : (
                                    <a 
                                        href={formatExternalUrl(project.liveUrl)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="project-hover-btn project-hover-btn--primary"
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
                                            className={`project-hover-btn ${!project.liveUrl ? 'project-hover-btn--primary' : ''}`}
                                            onClick={resetState}
                                        >
                                            Case Study
                                        </Link>
                                    )}
                                    {project.liveUrl && (
                                        <a 
                                            href={formatExternalUrl(project.liveUrl)} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="project-hover-btn project-hover-btn--primary"
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
        </motion.div>
    );
});

const Projects = memo(function Projects() {
    const { projects, isProjectsLoading } = useAdmin();
    const navigate = useNavigate();
    
    const activeProjects = (projects || [])
        .filter(p => p && p.enabled !== false)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .slice(0, 4);

    const showSkeleton = isProjectsLoading && activeProjects.length === 0;

    if (showSkeleton) {
        return (
            <section className="projects-section" id="projects">
                <div className="projects-container">
                    <div className="projects-header">
                        <h2 className="projects-title skeleton-text shimmer-placeholder" style={{ width: '220px', height: '32px', marginBottom: 0 }}></h2>
                        <span className="view-all-btn skeleton-text shimmer-placeholder" style={{ width: '80px', height: '20px', marginBottom: 0 }}></span>
                    </div>
                    <div className="projects-grid">
                        {[1, 2, 3, 4].map((n) => (
                            <div className="project-card-wrapper" key={n}>
                                <div className="project-card shimmer-placeholder" style={{ height: '350px', borderRadius: '24px' }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (activeProjects.length === 0) {
        return (
            <section className="projects-section" id="projects">
                <div className="projects-container">
                    <div className="projects-header">
                        <h2 className="projects-title">FEATURED PROJECTS</h2>
                    </div>
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.6)' }}>
                        <p style={{ fontSize: '16px', fontWeight: '500' }}>No active projects found in database.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="projects-section" id="projects">
            <div className="projects-container">
                <div className="projects-header">
                    <motion.h2 
                        className="projects-title"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        FEATURED PROJECTS
                    </motion.h2>
                    <MotionLink 
                        to="/projects"
                        className="view-all-btn"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                    >
                        VIEW ALL
                    </MotionLink>
                </div>

                <div className="projects-grid">
                    {activeProjects.map((project, index) => {
                        const cardLink = project.slug ? `/case-study/${project.slug}` : `/case-study/${project._id || project.id}`;
                        const coverImg = project.coverImage || project.image;
                        const cardTitle = project.name || project.title;

                        return (
                            <ProjectCard
                                key={project._id || project.id}
                                project={project}
                                index={index}
                                cardLink={cardLink}
                                coverImg={coverImg}
                                cardTitle={cardTitle}
                                navigate={navigate}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
});

export default Projects;

