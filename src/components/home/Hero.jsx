import React, { useState, useEffect, useMemo, lazy, Suspense, memo } from "react";
import "./Hero.css";
import { motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import SplitText from "../common/SplitText";

const LiquidEther = lazy(() => import("./LiquidEther"));

const HERO_LIQUID_COLORS = ["#5227FF", "#FF9FFC", "#B497CF"];
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
                        viscous={25}
                        iterationsViscous={14}
                        iterationsPoisson={14}
                        resolution={0.4}
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
            <div className="hero-container">
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
            </div>
        </section>
    );
});

export default Hero;