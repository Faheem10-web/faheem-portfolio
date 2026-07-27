import React, { useState, useEffect, useMemo, lazy, Suspense, memo } from "react";
import "./Hero.css";
import { motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import SplitText from "../common/SplitText";

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
  initial: { opacity: 0, y: 28 },
  animate: {
    opacity: 1,
    y: 0,
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

    const rawWordsJoined = Array.isArray(rawWords) ? rawWords.join('|') : (rawWords || '');

    const wordsList = useMemo(() => {
        const list = Array.isArray(rawWords) && rawWords.length > 0 
            ? [...rawWords] 
            : [name, "a UI/UX Designer", "a Frontend Developer"];
        if (list.length > 0 && list[0] === "Faheem" && name !== "Faheem") {
            list[0] = name;
        }
        return list;
    }, [rawWordsJoined, name]);

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
    }, [wordsList]);

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
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: 1
                        }}
                    />
                </Suspense>
            </div>

            <div className="hero-content">

                {/* Subtitle Badge */}
                <motion.div 
                    className="hero-badge"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="badge-pulse-dot" />
                    <span className="badge-text">AVAILABLE FOR FREELANCE & FULL-TIME</span>
                </motion.div>

                {/* Main Heading */}
                <h1 className="hero-title">
                    <motion.div 
                        className="hero-line hero-line-1"
                        variants={lineVariants}
                        initial="initial"
                        animate="animate"
                    >
                        <span className="hero-greeting">{heroSettings.greeting || "I AM"}</span>{" "}
                        <span className="hero-dynamic-wrapper">
                            <span className="hero-dynamic-text">{currentText}</span>
                            <span className="typewriter-cursor">|</span>
                        </span>
                    </motion.div>

                    <div className="hero-line hero-line-2">
                        <SplitText 
                            text={heroSettings.title1 || "Designing Future"} 
                            className="hero-split-text"
                            delay={35}
                            duration={1.1}
                            splitType="chars"
                            textAlign="center"
                        />
                    </div>

                    <div className="hero-line hero-line-3">
                        <SplitText 
                            text={heroSettings.title2 || "Digital Experiences"} 
                            className="hero-split-text gradient-text"
                            delay={35}
                            duration={1.1}
                            splitType="chars"
                            textAlign="center"
                        />
                    </div>
                </h1>

                <motion.p
                    className="hero-description"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                >
                    {heroSettings.description || "I create premium digital experiences with modern UI/UX design, scalable React development, smooth interactions and high-performance websites."}
                </motion.p>

            </div>
        </section>
    );
}

export default memo(Hero);