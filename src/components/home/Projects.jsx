import React, { useRef, memo } from "react";
import "./Projects.css";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext";
import { getOptimizedImageUrl } from "../../utils/imageOptimizer";

const MotionLink = motion(Link);

// Refactored Subcomponent for Home Page Project Card to handle direct mouse follow
const ProjectCard = memo(function ProjectCard({ project, index, cardLink, coverImg, cardTitle, navigate }) {
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
            className="project-card-wrapper"
            initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
            onClick={(e) => {
                if (!e.target.closest('a')) {
                    navigate(cardLink);
                }
            }}
            style={{ cursor: 'pointer' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="project-card" tabIndex="0">
                <img 
                    src={optimizedCover || "/assets/project_eco_shades.jpg"} 
                    alt={cardTitle} 
                    className="project-image" 
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        if (!e.target.src.endsWith('/assets/project_eco_shades.jpg')) {
                            e.target.src = '/assets/project_eco_shades.jpg';
                        }
                    }}
                />
                <div className="project-overlay">
                    <div className="project-hover-actions" ref={buttonsRef}>
                        <Link to={cardLink} className="project-hover-btn">
                            Case Study
                        </Link>
                        {project.liveUrl && (
                            <a 
                                href={project.liveUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="project-hover-btn project-hover-btn--primary"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span>Live Preview</span>
                                <FiExternalLink />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

function Projects() {
    const { projects, isProjectsLoading } = useAdmin();
    const navigate = useNavigate();
    
    const activeProjects = (projects || [])
        .filter(p => p && p.enabled !== false)
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

    return (
        <section className="projects-section" id="projects">
            <div className="projects-container">
                <div className="projects-header">
                    <motion.h2 
                        className="projects-title"
                        initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        FEATURED PROJECTS
                    </motion.h2>
                    <MotionLink 
                        to="/projects"
                        className="view-all-btn"
                        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
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
}

export default Projects;
