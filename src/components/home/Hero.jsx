import React, { useState, useEffect, useMemo, lazy, Suspense, memo, useRef } from "react";
import "./Hero.css";
import { motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import SplitText from "../common/SplitText";

const LiquidEther = lazy(() => import("./LiquidEther"));

const HERO_LIQUID_COLORS = ["#7C3AED", "#6D3DF5", "#A855F7"];
const FROM_CONFIG = { opacity: 0, y: 40 };
const TO_CONFIG = { opacity: 1, y: 0 };

const TypewriterTagline = memo(function TypewriterTagline({ greeting, wordsList, isSiteLoaded }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);

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
        <motion.div
            className="hero-tagline hero-glass-pill"
            initial={{ opacity: 0, y: 15 }}
            animate={isSiteLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <span className="tagline-prefix">{greeting || "I AM"}</span>
            <span className="tagline-typed">{currentText}</span>
            <span className="tagline-cursor">|</span>
        </motion.div>
    );
});

const Hero = memo(function Hero() {
    const { siteSettings, isSiteLoaded } = useAdmin();
    const heroRef = useRef(null);
    const mousePos = useRef({ currentX: 50, currentY: 45, targetX: 50, targetY: 45 });
    const rafId = useRef(null);

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
    }, [rawWords, name]);

    useEffect(() => {
        const isTouchOrMobile = window.matchMedia("(max-width: 768px)").matches || 'ontouchstart' in window;
        if (isTouchOrMobile) return;

        const handleMouseMove = (e) => {
            if (!heroRef.current) return;
            const rect = heroRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            mousePos.current.targetX = Math.max(0, Math.min(100, x));
            mousePos.current.targetY = Math.max(0, Math.min(100, y));
        };

        const handleMouseLeave = () => {
            mousePos.current.targetX = 50;
            mousePos.current.targetY = 45;
        };

        const updateLoop = () => {
            const { currentX, currentY, targetX, targetY } = mousePos.current;
            const lerpX = currentX + (targetX - currentX) * 0.05;
            const lerpY = currentY + (targetY - currentY) * 0.05;

            mousePos.current.currentX = lerpX;
            mousePos.current.currentY = lerpY;

            if (heroRef.current) {
                heroRef.current.style.setProperty('--mouse-x', `${lerpX.toFixed(2)}%`);
                heroRef.current.style.setProperty('--mouse-y', `${lerpY.toFixed(2)}%`);
                
                const offsetX = (lerpX - 50) / 50;
                const offsetY = (lerpY - 45) / 50;
                heroRef.current.style.setProperty('--mouse-x-offset', offsetX.toFixed(3));
                heroRef.current.style.setProperty('--mouse-y-offset', offsetY.toFixed(3));
            }

            rafId.current = requestAnimationFrame(updateLoop);
        };

        const heroEl = heroRef.current;
        if (heroEl) {
            heroEl.addEventListener('mousemove', handleMouseMove, { passive: true });
            heroEl.addEventListener('mouseleave', handleMouseLeave, { passive: true });
            rafId.current = requestAnimationFrame(updateLoop);
        }

        return () => {
            if (heroEl) {
                heroEl.removeEventListener('mousemove', handleMouseMove);
                heroEl.removeEventListener('mouseleave', handleMouseLeave);
            }
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);

    return (
        <section className="hero" id="home" ref={heroRef}>
            {/* Background */}
            <div className="hero-bg">
                <div className="hero-grid" aria-hidden="true"></div>

                <Suspense fallback={null}>
                    <LiquidEther
                        colors={HERO_LIQUID_COLORS}
                        mouseForce={15}
                        cursorSize={90}
                        isViscous
                        viscous={25}
                        iterationsViscous={14}
                        iterationsPoisson={14}
                        resolution={0.4}
                        isBounce={false}
                        autoDemo
                        autoSpeed={0.4}
                        autoIntensity={1.8}
                        takeoverDuration={0.25}
                        autoResumeDelay={3000}
                        autoRampDuration={0.6}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            opacity: 0.55,
                        }}
                    />
                </Suspense>

                <div className="hero-fluid-atmosphere" aria-hidden="true"></div>
                <div className="hero-glass-refraction" aria-hidden="true"></div>
                <div className="hero-glass-highlight" aria-hidden="true"></div>
                <div className="hero-overlay-fade" aria-hidden="true"></div>
            </div>

            {/* Content */}
            <motion.div 
                className="hero-container"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={isSiteLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <TypewriterTagline 
                    greeting={heroSettings.greeting}
                    wordsList={wordsList}
                    isSiteLoaded={isSiteLoaded}
                />

                <h1 className="hero-title">
                    <div className="hero-first-row">
                        <SplitText
                            text={heroSettings.title1 || "Designing Future"}
                            startAnimation={isSiteLoaded}
                            tag="span"
                            className="hero-split-line"
                            delay={35}
                            duration={0.8}
                            ease="power3.out"
                            splitType="chars"
                            from={FROM_CONFIG}
                            to={TO_CONFIG}
                            threshold={0.1}
                            rootMargin="-50px"
                            textAlign="center"
                        />
                    </div>
                    <div className="hero-gradient-text">
                        <SplitText
                            text={heroSettings.title2 || "Digital Experiences"}
                            startAnimation={isSiteLoaded}
                            tag="span"
                            className="hero-split-line-gradient"
                            delay={40}
                            duration={0.9}
                            ease="power3.out"
                            splitType="chars"
                            from={FROM_CONFIG}
                            to={TO_CONFIG}
                            threshold={0.1}
                            rootMargin="-50px"
                            textAlign="center"
                        />
                    </div>
                </h1>

                <motion.p
                    className="hero-description"
                    initial={{ opacity: 0, y: 15 }}
                    animate={isSiteLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                    transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                    {heroSettings.description || "I create premium digital experiences with modern UI/UX design, scalable React development, smooth interactions and high-performance websites."}
                </motion.p>
            </motion.div>
        </section>
    );
});

export default Hero;