import React, { useEffect, useState, useRef, memo } from "react";
import { motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import "./Loader.css";

/**
 * World-Class 2026 Apple / Linear-Style Minimal Preloader Component
 *
 * Design & Animation Specs:
 * • White background (#ffffff) with centered black "Faheem" branding.
 * • Thin animated underline (96px width) expanding symmetrically from center.
 * • No shutter panels, no camera effects, no dramatic motion.
 *
 * Timeline (~1.4s Total):
 * • 0.0s - 0.3s: Logo fades in (0.3s).
 * • 0.3s - 0.9s: Underline grows smoothly from center (0.6s).
 * • 0.9s - 1.0s: Brief hold (0.1s).
 * • 1.0s - 1.4s: Entire loader soft fades out smoothly (0.4s) while hero fades in naturally.
 * • 1.4s: Unmounts cleanly.
 */

const Loader = memo(function Loader({ onComplete }) {
  const { setIsSiteLoaded } = useAdmin();
  const [phase, setPhase] = useState(0); // 0: Logo fade in, 1: Underline grow, 2: Soft fade out
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const setIsSiteLoadedRef = useRef(setIsSiteLoaded);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    setIsSiteLoadedRef.current = setIsSiteLoaded;
  });

  useEffect(() => {
    // Respect prefers-reduced-motion settings
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      if (setIsSiteLoadedRef.current) setIsSiteLoadedRef.current(true);
      if (onCompleteRef.current && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    // Step 1 (0.3s): Underline starts growing smoothly from center
    const timer1 = setTimeout(() => {
      setPhase(1);
    }, 300);

    // Step 2 (1.0s): Begin soft fade-out transition & trigger hero reveal
    const timer2 = setTimeout(() => {
      setPhase(2);
      if (setIsSiteLoadedRef.current) {
        setIsSiteLoadedRef.current(true);
      }
    }, 1000);

    // Step 3 (1.4s): Loader fade-out completes, unmount cleanly
    const timer3 = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <motion.div 
      className="minimal-preloader-root"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 2 ? 0 : 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      {/* Center Logo ("Faheem") + Symmetrical Animated Underline */}
      <motion.div
        className="minimal-brand-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="minimal-brand-name">Faheem</h1>

        <div className="minimal-underline-track">
          <motion.div
            className="minimal-underline-fill"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{ transformOrigin: "center center" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
});

export default Loader;
