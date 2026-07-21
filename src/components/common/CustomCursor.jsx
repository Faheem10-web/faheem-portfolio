import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import "./CustomCursor.css";

function CustomCursor() {
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isInFooter, setIsInFooter] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Motion values for the cursor position
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Spring physics – glassy smooth lag for outer ring
    const springConfig = { damping: 28, stiffness: 180, mass: 0.6 };
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

        const handleMouseOver = (e) => {
            const target = e.target;
            if (!target) return;
            const isClickable = target.closest('a, button, [role="button"], input, select, textarea, img, .project-card, .project-card-wrapper, .service-card, .about-image-container, .social-link, .download-cv-btn, .view-all-btn, .faq-item');
            setIsHovered(!!isClickable);
            setIsInFooter(!!target.closest(".footer"));
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mouseover", handleMouseOver);
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("resize", checkTouch);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [cursorX, cursorY, isVisible]);

    if (isTouchDevice || !isVisible) return null;

    return (
        <>
            {/* Outer Ring with spring delay */}
            <motion.div
                className={`custom-cursor-outer ${isHovered ? "hovered" : ""} ${isInFooter ? "in-footer" : ""}`}
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
            {/* Inner Dot following directly */}
            <motion.div
                className={`custom-cursor-inner ${isHovered ? "hovered" : ""} ${isInFooter ? "in-footer" : ""}`}
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
