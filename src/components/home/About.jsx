import React from "react";
import "./About.css";
import { motion } from "framer-motion";
import { FiDownload, FiArrowRight, FiStar, FiCheckCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

function About() {
    const { siteSettings, downloadCv } = useAdmin();
    const aboutSettings = siteSettings?.about || {};
    const navSettings = siteSettings?.navbar || {};

    return (
        <section className="about-section" id="about">
            {/* Ethereal Pastels & Liquid Ambient Lighting */}
            <div className="about-bg-effects" aria-hidden="true">
                <div className="about-glow-orb orb-1"></div>
                <div className="about-glow-orb orb-2"></div>
                <div className="about-glow-orb orb-3"></div>
                <div className="about-grid-pattern"></div>
                <div className="about-glass-line"></div>
            </div>

            <div className="about-container">
                {/* Left Side: Frosted Glass Card (About Me Story) */}
                <motion.div 
                    className="about-left about-glass-card"
                    initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="about-badge-tag">
                        <FiStar className="badge-sparkle-icon" />
                        <span>CREATIVE DIRECTION & CODE</span>
                    </div>

                    <h2 className="about-title">
                        About Me<span className="purple-dot">.</span>
                    </h2>

                    <p className="about-text">
                        {aboutSettings.description || "Dynamic and result-oriented UI/UX engineer and front-end developer passionate about clean interfaces and high-performance React architectures."}
                    </p>

                    <div className="about-highlights-list">
                        <div className="highlight-pill">
                            <FiCheckCircle className="pill-check-icon" />
                            <span>Pixel-Perfect Crafts</span>
                        </div>
                        <div className="highlight-pill">
                            <FiCheckCircle className="pill-check-icon" />
                            <span>Smooth 60fps Motion</span>
                        </div>
                    </div>
                </motion.div>
                
                {/* Right Side: Glossy Liquid Glass Card (Working Together CTA) */}
                <motion.div 
                    className="about-right about-glass-card cta-gloss-card"
                    initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                >
                    <div className="cta-clean-block">
                        <h3 className="cta-title">
                            {aboutSettings.title || "Interested in working together?"}
                        </h3>

                        <p className="cta-subtitle">
                            {aboutSettings.subtitle || "Download my resume to learn more about my experience and qualifications."}
                        </p>
                        
                        {/* 2 Liquid Glass Frosted & Glossy Buttons */}
                        <div className="about-buttons-row">
                            <a 
                                href="#download-cv" 
                                onClick={(e) => { e.preventDefault(); downloadCv(); }} 
                                className="download-cv-btn liquid-glass-btn-primary"
                            >
                                <div className="btn-gloss-overlay"></div>
                                <FiDownload className="btn-icon-svg" />
                                <span>{navSettings.downloadCvBtnText || "Download CV"}</span>
                            </a>

                            <Link to="/about" className="more-about-btn liquid-glass-btn-secondary">
                                <div className="btn-gloss-overlay"></div>
                                <span>More About Me</span>
                                <FiArrowRight className="btn-arrow-icon" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default About;
