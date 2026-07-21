import React, { useEffect, useRef } from "react";
import "./ProjectsPage.css";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiArrowRight, 
    FiExternalLink
} from "react-icons/fi";
import { projectsData } from "../data/projectsData";
import { useAdmin } from "../context/AdminContext";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";

// Refactored Subcomponent for Project Card to handle direct mouse follow
function ProjectCard({ project, index, cardLink, coverImg, cardTitle, demoLink }) {
    const buttonsRef = useRef(null);

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
    };

    const handleMouseLeave = () => {
        if (!buttonsRef.current) return;
        buttonsRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    };

    const optimizedCover = getOptimizedImageUrl(coverImg, { width: 800 });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="proj-card-box"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="proj-card-inner" tabIndex="0">
                <div className="proj-card-image-wrap">
                    <img src={optimizedCover} alt={cardTitle} className="proj-card-image" loading="lazy" decoding="async" />
                    
                    {/* Premium Glass Overlay & Centered Buttons */}
                    <div className="proj-card-hover-overlay">
                        <div className="proj-card-hover-buttons" ref={buttonsRef}>
                            <Link to={cardLink} className="hover-btn hover-btn-glass">
                                Case Study
                            </Link>
                            {demoLink && (
                                <a 
                                    href={demoLink} 
                                    className="hover-btn hover-btn-purple" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span>Live Preview</span>
                                    <FiExternalLink />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="proj-card-meta">
                    <div className="meta-top">
                        <span className="meta-category">{project.category}</span>
                    </div>
                    <h3 className="meta-title">{cardTitle}</h3>
                    
                    <div className="proj-card-actions">
                        <Link to={cardLink} className="action-btn action-primary">
                            <span>Case Study</span>
                            <FiArrowRight />
                        </Link>
                        {demoLink && (
                            <a href={demoLink} className="action-btn action-secondary" target="_blank" rel="noreferrer">
                                <FiExternalLink />
                                <span>Live Preview</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ProjectsPage() {
    const { projects, isProjectsLoading } = useAdmin();
    
    const dbProjects = projects && projects.length > 0
        ? projects.filter(p => p.enabled !== false)
        : [];

    const showSkeleton = isProjectsLoading && dbProjects.length === 0;

    const activeProjects = dbProjects.length > 0
        ? dbProjects
        : (!isProjectsLoading ? projectsData : []);

    useEffect(() => {
        window.scrollTo(0, 0);
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
