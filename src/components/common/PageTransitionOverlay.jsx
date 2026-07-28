import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import "./PageTransitionOverlay.css";

// Page Title Resolver for clean transition badge
const getPageTitle = (pathname) => {
  if (pathname === "/") return "HOME";
  if (pathname === "/about") return "ABOUT";
  if (pathname === "/projects") return "PORTFOLIO";
  if (pathname === "/contact") return "CONTACT";
  if (pathname.startsWith("/case-study")) return "CASE STUDY";
  return "FAHEEM";
};

// Fluid Curve Variants for 60 FPS GPU-accelerated curtain wipe
const curtainVariants = {
  initial: {
    y: "100%",
    borderTopLeftRadius: "50% 20%",
    borderTopRightRadius: "50% 20%"
  },
  animate: {
    y: "0%",
    borderTopLeftRadius: "0% 0%",
    borderTopRightRadius: "0% 0%",
    transition: {
      duration: 0.5,
      ease: [0.76, 0, 0.24, 1]
    }
  },
  exit: {
    y: "-100%",
    borderBottomLeftRadius: "50% 20%",
    borderBottomRightRadius: "50% 20%",
    transition: {
      duration: 0.55,
      ease: [0.76, 0, 0.24, 1]
    }
  }
};

const textVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -30, 
    scale: 0.95,
    transition: { duration: 0.25, ease: [0.76, 0, 0.24, 1] } 
  }
};

export default function PageTransitionOverlay() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="cs-transition-layer"
        variants={curtainVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Subtle accent edge glow line */}
        <div className="cs-transition-edge-glow" />

        {/* Center Typography Badge */}
        <motion.div className="cs-transition-content" variants={textVariants}>
          <span className="cs-transition-brand">FAHEEM</span>
          <span className="cs-transition-divider">•</span>
          <span className="cs-transition-title">{pageTitle}</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
