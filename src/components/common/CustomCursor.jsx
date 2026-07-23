import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import "./CustomCursor.css";

function CustomCursor() {
    const [isHovered, setIsHovered] = useState(false);
    const [isTextHovered, setIsTextHovered] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isInFooter, setIsInFooter] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Motion values for the cursor position
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Spring physics – smooth fluid lag for glassmorphism outer ring
    const springConfig = { damping: 26, stiffness: 240, mass: 0.4 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const checkTouch = () => {
            setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };
        checkTouch();
        window.addEventListener("resize", checkTouch);

        const moveCursor = (e) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
            if (e.target) {
                setIsInFooter(!!e.target.closest(".footer"));
            }
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const handleMouseEnter = () => {
            setIsVisible(true);
        };

        const handleMouseDown = () => setIsMouseDown(true);
        const handleMouseUp = () => setIsMouseDown(false);

        const handleMouseOver = (e) => {
            const target = e.target;
            if (!target) return;

            // Check if hovering over any text input / textarea / editable text box
            const isTextInput = target.closest(
                'input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], input:not([type]), textarea, [contenteditable="true"], .input-field, .form-input, .chat-input, .chat-input-wrapper'
            );

            // Check if hovering over clickable / interactive elements
            const isClickable = target.closest(
                'a, button, [role="button"], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], input[type="file"], label, img, svg, path, .project-card, .project-card-wrapper, .service-card, .about-image-container, .social-link, .download-cv-btn, .view-all-btn, .faq-item, .glass-card, .hero-glass-pill, [onclick]'
            );

            if (isTextInput) {
                setIsTextHovered(true);
                setIsHovered(false);
            } else if (isClickable) {
                setIsHovered(true);
                setIsTextHovered(false);
            } else {
                setIsHovered(false);
                setIsTextHovered(false);
            }

            setIsInFooter(!!target.closest(".footer"));
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mouseover", handleMouseOver);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("resize", checkTouch);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [cursorX, cursorY, isVisible]);

    if (isTouchDevice || !isVisible) return null;

    return (
        <>
            {/* Outer Glassmorphism Ring / Capsule */}
            <motion.div
                className={`custom-cursor-outer ${isTextHovered ? "text-hovered" : isHovered ? "hovered" : ""} ${isMouseDown ? "active" : ""} ${isInFooter ? "in-footer" : ""}`}
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
            {/* Inner Glowing Core Dot / Liquid Glass Beam */}
            <motion.div
                className={`custom-cursor-inner ${isTextHovered ? "text-hovered" : isHovered ? "hovered" : ""} ${isMouseDown ? "active" : ""} ${isInFooter ? "in-footer" : ""}`}
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
        </>
    );
}

export default CustomCursor;


