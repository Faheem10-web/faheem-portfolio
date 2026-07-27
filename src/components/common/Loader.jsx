import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import "./Loader.css";
import { useAdmin } from "../../context/AdminContext";

const containerVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function Loader({ onComplete, isLoading }) {
  const { siteSettings } = useAdmin();
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const completedRef = useRef(false);

  const portfolioName = siteSettings?.global?.portfolioName || siteSettings?.hero?.name || "Faheem";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      if (onComplete) onComplete();
      return;
    }

    const DURATION = 1100; // Smooth 1.1s sequence

    const updateProgress = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearRatio = Math.min(elapsed / DURATION, 1);

      const easedRatio =
        linearRatio < 0.5
          ? 4 * linearRatio * linearRatio * linearRatio
          : 1 - Math.pow(-2 * linearRatio + 2, 3) / 2;

      let currentVal = easedRatio * 100;

      if (isLoading && elapsed < 1200 && currentVal > 98) {
        currentVal = 98;
      }

      setProgress(currentVal);

      if (currentVal < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else if (!completedRef.current) {
        completedRef.current = true;
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 120);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLoading, onComplete]);

  const formattedProgress = Math.round(progress).toString();

  return (
    <motion.div
      className="custom-light-loader"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="loader-box">
        {/* Brand Logo & Name */}
        <div className="loader-brand-header">
          <div className="loader-brand-icon" aria-hidden="true">
            <span className="squircle squircle-1"></span>
            <span className="squircle squircle-2"></span>
          </div>
          <h1 className="loader-brand-name">
            {portfolioName}<span className="brand-dot">.</span>
          </h1>
        </div>

        {/* Gradient Progress Bar Line */}
        <div className="loader-line-track">
          <div
            className="loader-line-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage Counter */}
        <div className="loader-percent-text">
          {formattedProgress}%
        </div>
      </div>
    </motion.div>
  );
}
