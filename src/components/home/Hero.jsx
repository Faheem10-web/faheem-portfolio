import React from "react";
import "./Hero.css";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";

const blurFadeVariant = {
  initial: { opacity: 0, y: 35, filter: "blur(12px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.0,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

function Hero() {
    const { siteSettings } = useAdmin();
    
    const heroSettings = siteSettings?.hero || {};
    const title1 = heroSettings.title1 || "DESIGNING FUTURE";
    const title2 = heroSettings.title2 || "DIGITAL EXPERIENCES";
    const description = heroSettings.description || "I create premium digital experiences with modern UI/UX design, scalable React development, smooth interactions and high-performance websites.";
    const availabilityText = heroSettings.availabilityText || "Available for new projects";

    // Smooth 60 FPS Mouse Parallax Effect for Atmospheric Glow
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    const springX = useSpring(mouseX, { stiffness: 45, damping: 25 });
    const springY = useSpring(mouseY, { stiffness: 45, damping: 25 });

    const glowX = useTransform(springX, [-0.5, 0.5], [-35, 35]);
    const glowY = useTransform(springY, [-0.5, 0.5], [-35, 35]);

    const handleMouseMove = (e) => {
        const { innerWidth, innerHeight } = window;
        const x = (e.clientX / innerWidth) - 0.5;
        const y = (e.clientY / innerHeight) - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    return (
        <section className="hero-editorial" id="home" onMouseMove={handleMouseMove}>

            {/* ── ATMOSPHERIC BACKGROUND LAYERS (Awwwards 2026 Ambient Lighting) ── */}
            <div className="hero-bg-canvas" aria-hidden="true">
                <motion.div 
                    className="hero-aurora-mesh" 
                    style={{ x: glowX, y: glowY }}
                />
                <motion.div 
                    className="hero-radial-bloom"
                    style={{ x: glowX, y: glowY }}
                />
                <div className="hero-noise-texture" />
                <div className="hero-light-vignette" />
                <div className="hero-fade-overlay" />
            </div>

            {/* ── HERO MAIN EDITORIAL CONTENT CONTAINER ── */}
            <div className="hero-editorial-container">

                {/* 1. Small Floating Glass Badge */}
                <motion.div
                    className="hero-glass-badge"
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                >
                    <span className="hero-badge-dot"></span>
                    <span className="hero-badge-text">I AM A UI/UX DESIGNER</span>
                </motion.div>

                {/* 2. Giant Typography Headline */}
                <h1 className="hero-editorial-headline">
                    <motion.div
                        className="headline-line-1"
                        variants={blurFadeVariant}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.2 }}
                    >
                        {title1}
                    </motion.div>
                    <motion.div
                        className="headline-line-2"
                        variants={blurFadeVariant}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.38 }}
                    >
                        {title2}
                    </motion.div>
                </h1>

                {/* 3. Description (Max Width 620px) */}
                <motion.p
                    className="hero-editorial-description"
                    initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                >
                    {description}
                </motion.p>

            </div>

            {/* 4. Bottom Info Glass Pills */}
            <div className="hero-bottom-bar">
                {/* Bottom Left Glass Pill */}
                <motion.div
                    className="hero-bottom-pill hero-bottom-left"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="bottom-pill-handle">@_faheem</span>
                </motion.div>

                {/* Bottom Right Glass Pill */}
                <motion.div
                    className="hero-bottom-pill hero-bottom-right"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="bottom-status-dot"></span>
                    <span className="bottom-pill-status">{availabilityText}</span>
                </motion.div>
            </div>

        </section>
    );
}

export default Hero;