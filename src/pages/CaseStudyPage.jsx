import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config/api";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";
import "./CaseStudyPage.css";

function CaseStudyPage() {
    const { id } = useParams();
    const { projects } = useAdmin();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProject = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/projects/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProject(data);
                } else {
                    const found = (projects || []).find(p => p.slug === id || p._id === id || p.id === id);
                    setProject(found || null);
                }
            } catch (err) {
                console.error("Failed to fetch project details from API:", err);
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
            <div className="case-study-loading" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '18px', fontWeight: '500' }}>Loading case study details...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="case-study-not-found">
                <h2>Project Not Found</h2>
                <p>We couldn't find the case study you were looking for.</p>
                <Link to="/projects" className="back-home-btn">
                    Back to Projects
                </Link>
            </div>
        );
    }

    const titleText = project.name || project.title;
    const challengeText = project.challenge || project.challenges || "No challenge description loaded yet.";
    const solutionText = project.solution || project.solutions || "No solution description loaded yet.";
    const resultText = project.results || "No results details loaded yet.";
    const conclusionText = project.longDesc || project.conclusion || "No conclusion loaded yet.";
    const clientName = project.client || "Self Project";
    const bannerImgUrl = project.bannerImage || project.coverImage || project.image;
    const demoLinkUrl = project.liveUrl || project.demoLink;

    return (
        <div className="case-study-wrapper">
            
            {/* ── HERO BANNER ── */}
            <div className="case-study-hero-banner">
                <img 
                    src={bannerImgUrl} 
                    alt={`${titleText} Banner`} 
                    className="hero-banner-img"
                />
                <div className="hero-banner-overlay" />
            </div>

            {/* ── MAIN CONTENT CONTAINER (SPLIT LAYOUT) ── */}
            <div className="case-study-split-container">
                
                {/* LEFT COLUMN: Case Study Sections & Mockups */}
                <main className="case-study-left-content">
                    
                    {/* The Challenge */}
                    <section className="case-study-section">
                        <h2 className="section-heading">The challenge</h2>
                        <p className="section-paragraph">{challengeText}</p>
                        <div className="section-mockup-wrapper">
                            <img 
                                src={getOptimizedImageUrl(project.challengeImage || "/assets/mockup_challenge.png", { width: 1200 })} 
                                alt="Challenge Mockup" 
                                className="section-mockup-img"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { if (e.target.parentElement) e.target.parentElement.style.display = 'none'; }}
                            />
                        </div>
                    </section>

                    {/* The Solution */}
                    <section className="case-study-section">
                        <h2 className="section-heading">The solution</h2>
                        <p className="section-paragraph">{solutionText}</p>
                        <div className="section-mockup-wrapper">
                            <img 
                                src={getOptimizedImageUrl(project.solutionImage || "/assets/mockup_solution.png", { width: 1200 })} 
                                alt="Solution Mockup" 
                                className="section-mockup-img"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { if (e.target.parentElement) e.target.parentElement.style.display = 'none'; }}
                            />
                        </div>
                    </section>

                    {/* The Result */}
                    <section className="case-study-section">
                        <h2 className="section-heading">The result</h2>
                        <p className="section-paragraph">{resultText}</p>
                        <div className="section-mockup-wrapper">
                            <img 
                                src={getOptimizedImageUrl(project.resultImage || "/assets/mockup_result.png", { width: 1200 })} 
                                alt="Result Mockup" 
                                className="section-mockup-img"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { if (e.target.parentElement) e.target.parentElement.style.display = 'none'; }}
                            />
                        </div>
                    </section>

                    {/* Conclusion */}
                    <section className="case-study-section">
                        <h2 className="section-heading">Conclusion</h2>
                        <p className="section-paragraph">{conclusionText}</p>
                    </section>

                </main>

                {/* RIGHT COLUMN: Sticky Sidebar */}
                <aside className="case-study-sidebar">
                    <div className="sidebar-sticky-box">
                        
                        <h1 className="sidebar-project-title">{titleText}</h1>
                        <p className="sidebar-project-subtitle">{project.shortDesc || project.subtitle}</p>
 
                        <div className="sidebar-meta-table">
                            
                            <div className="meta-table-row">
                                <span className="meta-table-label">Project type</span>
                                <span className="meta-table-value">{project.category}</span>
                            </div>

                            <div className="meta-table-row">
                                <span className="meta-table-label">Year</span>
                                <span className="meta-table-value">{project.year}</span>
                            </div>

                            <div className="meta-table-row">
                                <span className="meta-table-label">Client</span>
                                <span className="meta-table-value">{clientName}</span>
                            </div>

                            {demoLinkUrl && (
                                <div className="meta-table-row borderless">
                                    <span className="meta-table-label">Live project</span>
                                    <span className="meta-table-value">
                                        <a 
                                            href={demoLinkUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="live-project-pill-btn"
                                        >
                                            Live link
                                        </a>
                                    </span>
                                </div>
                            )}

                        </div>

                        {/* Back to Projects */}
                        <div className="sidebar-footer-nav">
                            <Link to="/projects" className="explore-more-btn">
                                <span>Explore other projects</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-arrow">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                        </div>

                    </div>
                </aside>

            </div>

        </div>
    );
}

export default CaseStudyPage;
