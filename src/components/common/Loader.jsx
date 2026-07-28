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
      duration: 0.35,
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

  const brandText = siteSettings?.navbar?.logoText || siteSettings?.global?.portfolioName || "FAHEEM";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      if (onComplete) onComplete();
      return;
    }

    const DURATION = 5000; // Exactly 5 seconds sequence

    const updateProgress = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearRatio = Math.min(elapsed / DURATION, 1);

      // Smooth soft easing curve over 5 seconds
      const easedRatio = 1 - Math.pow(1 - linearRatio, 3);
      const currentVal = easedRatio * 100;

      setProgress(currentVal);

      if (currentVal >= 100 || elapsed >= DURATION) {
        if (!completedRef.current) {
          completedRef.current = true;
          if (onComplete) onComplete();
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onComplete]);

  return (
    <motion.div
      className="minimal-white-loader"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="minimal-loader-content">
        {/* Small Centered Brand Logo/Text */}
        <h1 className="minimal-loader-brand">
          {brandText}
        </h1>

        {/* Thin 2px Animated Loading Line */}
        <div className="minimal-loader-track">
          <div
            className="minimal-loader-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
