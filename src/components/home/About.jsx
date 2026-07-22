import React from "react";
import "./About.css";
import { motion } from "framer-motion";
import { FiDownload, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

function About() {
    const { siteSettings, downloadCv } = useAdmin();
    const aboutSettings = siteSettings?.about || {};
    const navSettings = siteSettings?.navbar || {};

    return (
        <section className="about-section" id="about">
            {/* Ultra-Premium Ambient Light Flares & Mesh Grid Background */}
            <div className="about-bg-effects" aria-hidden="true">
                <div className="about-glow-orb orb-1"></div>
                <div className="about-glow-orb orb-2"></div>
                <div className="about-grid-pattern"></div>
                <div className="about-glass-line"></div>
            </div>

            <div className="about-container">
                {/* Left Side: Title + Description */}
                <motion.div 
                    className="about-left"
                    initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h2 className="about-title">
                        About Me<span className="purple-dot">.</span>
                    </h2>
                    <p className="about-text">
                        {aboutSettings.description || "Dynamic and result-oriented UI/UX engineer and front-end developer passionate about clean interfaces and high-performance React architectures."}
                    </p>
                </motion.div>
                
                {/* Right Side: Working Together CTA + 2 Buttons */}
                <motion.div 
                    className="about-right"
                    initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                >
                    <div className="cta-clean-block">
                        <h3 className="cta-title">
                            {aboutSettings.title || "Interested in working together?"}
                        </h3>
                        <p className="cta-subtitle">
                            {aboutSettings.subtitle || "Download my resume to learn more about my experience and qualifications."}
                        </p>
                        
                        {/* 2 Premium Glass Buttons */}
                        <div className="about-buttons-row">
                            <a 
                                href="#download-cv" 
                                onClick={(e) => { e.preventDefault(); downloadCv(); }} 
                                className="download-cv-btn"
                            >
                                <FiDownload />
                                <span>{navSettings.downloadCvBtnText || "Download CV"}</span>
                            </a>

                            <Link to="/about" className="more-about-btn">
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
