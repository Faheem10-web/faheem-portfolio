import React, { memo } from "react";
import "./About.css";
import { motion } from "framer-motion";
import { FiArrowRight, FiStar, FiCheckCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import Magnetic from "../common/Magnetic";

// ============================================================================
// PERFORMANCE OPTIMIZATIONS (Framer Motion & Rendering):
// 1. Static animation variants and transition objects are declared outside the 
//    component to avoid object re-creation on every re-render, reducing GC overhead.
// 2. Animations strictly animate GPU-accelerated properties (`opacity` and `y` transform).
// ============================================================================
const CARD_VARIANTS = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const LEFT_CARD_TRANSITION = { duration: 0.6, ease: [0.16, 1, 0.3, 1] };
const RIGHT_CARD_TRANSITION = { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.08 };
const VIEWPORT_CONFIG = { once: true, margin: "-40px" };

const About = memo(function About() {
    const { siteSettings } = useAdmin();
    const rawAbout = siteSettings?.about || {};
    const aboutSettings = rawAbout.home || rawAbout;
    const navSettings = siteSettings?.navbar || {};

    return (
        <section className="about-section" id="about">
            {/* Ethereal Pastels & Liquid Ambient Lighting */}
            <div className="about-bg-effects" aria-hidden="true">
                <div className="about-glow-orb orb-1"></div>
                <div className="about-glow-orb orb-2"></div>
                <div className="about-glow-orb orb-3"></div>
                <div className="about-grid-pattern"></div>
            </div>

            <div className="about-container">
                {/* Left Side: Frosted Glass Card (About Me Story) */}
                <motion.div 
                    className="about-left about-glass-card"
                    initial="hidden"
                    whileInView="visible"
                    variants={CARD_VARIANTS}
                    viewport={VIEWPORT_CONFIG}
                    transition={LEFT_CARD_TRANSITION}
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
                    initial="hidden"
                    whileInView="visible"
                    variants={CARD_VARIANTS}
                    viewport={VIEWPORT_CONFIG}
                    transition={RIGHT_CARD_TRANSITION}
                >
                    <div className="cta-clean-block">
                        <h3 className="cta-title">
                            {aboutSettings.title || "Interested in working together?"}
                        </h3>

                        <p className="cta-subtitle">
                            {aboutSettings.subtitle || "Feel free to explore my background or get in touch to discuss projects and opportunities."}
                        </p>
                        
                        {/* Glossy Button with Magnetic Attraction */}
                        <div className="about-buttons-row">
                            <Magnetic strength={0.2}>
                                <Link to="/about" className="more-about-btn liquid-glass-btn-primary">
                                    <div className="btn-gloss-overlay"></div>
                                    <span>More About Me</span>
                                    <FiArrowRight className="btn-arrow-icon" />
                                </Link>
                            </Magnetic>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
});

export default About;
