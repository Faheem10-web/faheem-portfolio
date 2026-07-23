import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import "./Hero.css";
import { motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";

import {
  FaFigma,
  FaGithub,
  FaReact,
  FaNodeJs,
  FaGitAlt,
  FaCss3Alt,
  FaHtml5,
  FaJsSquare
} from "react-icons/fa";
import { TbBrandAdobe } from "react-icons/tb";
import {
  SiNextdotjs,
  SiTailwindcss,
  SiTypescript,
  SiFramer
} from "react-icons/si";

const LiquidEther = lazy(() => import("./LiquidEther"));

const HERO_LIQUID_COLORS = ["#5227FF", "#FF9FFC", "#B497CF"];
const MARQUEE_ITEMS = [
  { label: "Figma UI/UX", icon: FaFigma },
  { label: "GitHub & Version Control", icon: FaGithub },
  { label: "Adobe Creative Suite", icon: TbBrandAdobe },
  { label: "React.js", icon: FaReact },
  { label: "Next.js Framework", icon: SiNextdotjs },
  { label: "JavaScript ES6+", icon: FaJsSquare },
  { label: "Tailwind CSS", icon: SiTailwindcss },
  { label: "TypeScript", icon: SiTypescript },
  { label: "Framer Motion", icon: SiFramer },
  { label: "HTML5 & Modern Web", icon: FaHtml5 },
  { label: "CSS3 Styling", icon: FaCss3Alt },
  { label: "Node.js Backend", icon: FaNodeJs },
  { label: "Git Workflow", icon: FaGitAlt }
];

const lineVariants = {
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

function Hero() {
    const { siteSettings } = useAdmin();
    
    const heroSettings = siteSettings?.hero || {};
    const name = heroSettings.name || "Faheem";
    const rawWords = heroSettings.words;

    const wordsList = useMemo(() => {
        const list = Array.isArray(rawWords) && rawWords.length > 0 
            ? [...rawWords] 
            : [name, "a UI/UX Designer", "a Frontend Developer"];
        if (list.length > 0 && list[0] === "Faheem" && name !== "Faheem") {
            list[0] = name;
        }
        return list;
    }, [JSON.stringify(rawWords), name]);

    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);

    // Safely reset typewriter animation state when wordsList changes
    useEffect(() => {
        setCurrentWordIndex(0);
        setCurrentText("");
        setIsDeleting(false);
        setTypingSpeed(100);
    }, [JSON.stringify(wordsList)]);

    useEffect(() => {
        const handleType = () => {
            const safeIndex = currentWordIndex < wordsList.length ? currentWordIndex : 0;
            const fullWord = wordsList[safeIndex];
            if (!fullWord) return;

            if (!isDeleting) {
                setCurrentText(fullWord.substring(0, currentText.length + 1));
                setTypingSpeed(100);

                if (currentText === fullWord) {
                    setTypingSpeed(2000);
                    setIsDeleting(true);
                }
            } else {
                setCurrentText(fullWord.substring(0, currentText.length - 1));
                setTypingSpeed(50);

                if (currentText === "") {
                    setIsDeleting(false);
                    setCurrentWordIndex((prev) => (prev + 1) % wordsList.length);
                    setTypingSpeed(500);
                }
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentWordIndex, typingSpeed, wordsList]);

    return (
        <section className="hero" id="home">

            {/* Background */}
            <div className="hero-bg">
                <Suspense fallback={null}>
                    <LiquidEther
                        colors={HERO_LIQUID_COLORS}
                        mouseForce={20}
                        cursorSize={100}
                        isViscous
                        viscous={30}
                        iterationsViscous={32}
                        iterationsPoisson={32}
                        resolution={0.5}
                        isBounce={false}
                        autoDemo
                        autoSpeed={0.5}
                        autoIntensity={2.2}
                        takeoverDuration={0.25}
                        autoResumeDelay={3000}
                        autoRampDuration={0.6}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </Suspense>

                <div className="hero-aurora-mesh" aria-hidden="true"></div>
                <div className="hero-radial-glow" aria-hidden="true"></div>
                <div className="hero-noise" aria-hidden="true"></div>
                <div className="hero-vignette" aria-hidden="true"></div>
                <div className="hero-overlay" aria-hidden="true"></div>
            </div>

            {/* Content */}

            {/* Ambient Vibrant Liquid Gradient Blobs (Behind the Card for Liquid Glass Effect) */}
            <div className="hero-liquid-orbs" aria-hidden="true">
                <div className="liquid-orb orb-red-1"></div>
                <div className="liquid-orb orb-red-2"></div>
                <div className="liquid-orb orb-purple-3"></div>
            </div>

            {/* ── LUXURIOUS GLASSMORPHISM CARD CONTAINER (BOX MODEL MATCHING MOCKUP) ── */}
            <div className="hero-container">
                <motion.div 
                    className="hero-glass-card"
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Specular Inner Glare Overlay */}
                    <div className="hero-card-glare" aria-hidden="true"></div>

                    {/* 1. Card Top Bar Header */}
                    <div className="hero-card-header">
                        <div className="hero-card-meta">
                            <span className="meta-dot"></span>
                            <span className="meta-label">Glassmorphic UI / UX</span>
                        </div>

                        <div className="hero-card-action-tag">
                            <span>Let's create</span>
                        </div>
                    </div>

                    {/* 2. Main Center Body Content */}
                    <div className="hero-card-body">
                        <motion.div
                            className="hero-tagline hero-glass-pill"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <span className="tagline-prefix">{heroSettings.greeting || "Hello, I'm"}</span>
                            <span className="tagline-typed">{currentText}</span>
                            <span className="tagline-cursor">|</span>
                        </motion.div>

                        <h1 className="hero-title">
                            <motion.div
                                className="hero-first-row"
                                variants={lineVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: 0.3 }}
                            >
                                {heroSettings.title1 || "Designing Future"}
                            </motion.div>
                            <motion.div
                                className="hero-gradient-text"
                                variants={lineVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: 0.45 }}
                            >
                                {heroSettings.title2 || "Digital Experiences."}
                            </motion.div>
                        </h1>

                        <motion.p
                            className="hero-description"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {heroSettings.description || "I create premium digital experiences with modern UI/UX design, scalable React development, smooth interactions and high-performance websites."}
                        </motion.p>
                    </div>

                    {/* 3. Card Bottom Bar Footer */}
                    <div className="hero-card-footer">
                        <div className="hero-card-handle">
                            <span>@_{name.toLowerCase()}</span>
                        </div>

                        {heroSettings.isAvailable !== false && (
                            <div className="hero-card-status">
                                <span className="status-live-dot"></span>
                                <span>{heroSettings.availabilityText || "Available for projects"}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default Hero;