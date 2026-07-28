import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import "./Loader.css";

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

const cardVariants = {
  initial: { opacity: 0, scale: 0.96, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -6 },
};

export default function Loader({ onComplete, isLoading }) {
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      if (onComplete) onComplete();
      return;
    }

    const DURATION = 220; // 60 FPS sub-300ms responsive fill

    const updateProgress = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearRatio = Math.min(elapsed / DURATION, 1);

      // Silky cubic ease-out curve
      const easedRatio = 1 - Math.pow(1 - linearRatio, 3);
      const currentVal = easedRatio * 100;

      setProgress(currentVal);

      if (currentVal >= 100 || (!isLoading && elapsed >= 120)) {
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
  }, [isLoading, onComplete]);

  return (
    <motion.div
      className="glass-loader-root"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      {/* Floating Glassmorphism Card */}
      <motion.div
        className="glass-loader-card"
        variants={cardVariants}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Semi-bold FAHEEM Text */}
        <h1 className="glass-loader-brand">
          FAHEEM
        </h1>

        {/* Thin 2px Animated Loading Line */}
        <div className="glass-loader-track">
          <div
            className="glass-loader-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
