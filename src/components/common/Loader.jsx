import React, { useEffect, useState, useRef, memo } from "react";
import { motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import "./Loader.css";

/**
 * World-Class 2026 Premium Shutter Preloader Component
 *
 * Symmetrically Centered Animation:
 * Underline grows outwards from the exact CENTER center point (transformOrigin: "center"),
 * ensuring text heading ("Faheem") and loading line remain 100% pixel-perfect centered throughout.
 */

// Premium luxury camera shutter cubic-bezier easing curve
const SHUTTER_EASE = [0.77, 0, 0.175, 1];
const CONTENT_EASE = [0.16, 1, 0.3, 1];

const Loader = memo(function Loader({ onComplete }) {
  const { setIsSiteLoaded } = useAdmin();
  const [phase, setPhase] = useState(0); // 0: Logo fade in, 1: Underline grow, 2: Shutter open
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const setIsSiteLoadedRef = useRef(setIsSiteLoaded);

  // Synchronize ref callbacks without re-triggering animation timers
  useEffect(() => {
    onCompleteRef.current = onComplete;
    setIsSiteLoadedRef.current = setIsSiteLoaded;
  });

  useEffect(() => {
    // Respect user prefers-reduced-motion settings
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      if (setIsSiteLoadedRef.current) setIsSiteLoadedRef.current(true);
      if (onCompleteRef.current && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    // Step 1 (0.3s): Underline starts growing smoothly from center (scaleX 0 -> 1 over 0.7s)
    const timer1 = setTimeout(() => {
      setPhase(1);
    }, 300);

    // Step 2 (1.0s): Shutter panels begin opening vertically
    const timer2 = setTimeout(() => {
      setPhase(2);
    }, 1000);

    // Step 2b (1.05s): Trigger Hero section reveal animation right as shutters open
    const timer3 = setTimeout(() => {
      if (setIsSiteLoadedRef.current) {
        setIsSiteLoadedRef.current(true);
      }
    }, 1050);

    // Step 3 (1.65s): Complete preloader lifecycle & remove from DOM
    const timer4 = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 1650);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []); // [] ensures single execution on mount

  return (
    <motion.div 
      className="shutter-preloader-root"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      {/* Top Shutter Panel */}
      <motion.div
        className="shutter-panel top-panel"
        initial={{ y: "0%" }}
        animate={{ y: phase >= 2 ? "-100%" : "0%" }}
        transition={{ duration: 0.6, ease: SHUTTER_EASE }}
      />

      {/* Bottom Shutter Panel */}
      <motion.div
        className="shutter-panel bottom-panel"
        initial={{ y: "0%" }}
        animate={{ y: phase >= 2 ? "100%" : "0%" }}
        transition={{ duration: 0.6, ease: SHUTTER_EASE }}
      />

      {/* Center Logo ("Faheem") + Symmetrical Animated Underline */}
      <motion.div
        className="shutter-brand-wrapper"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{
          opacity: phase === 2 ? 0 : 1,
          scale: phase === 2 ? 0.96 : 1,
        }}
        transition={{ duration: phase === 2 ? 0.2 : 0.3, ease: CONTENT_EASE }}
      >
        <h1 className="shutter-brand-name">Faheem</h1>

        <div className="shutter-underline-track">
          <motion.div
            className="shutter-underline-fill"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
            style={{ transformOrigin: "center center" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
});

export default Loader;
