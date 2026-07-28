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

export default function Loader({ onComplete, isLoading }) {
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      if (onComplete) onComplete();
      return;
    }

    const MIN_DURATION = 5000; // 5 seconds (5000ms) loader sequence

    const updateProgress = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearRatio = Math.min(elapsed / MIN_DURATION, 1);

      // Smooth cubic ease-out curve
      const easedRatio = 1 - Math.pow(1 - linearRatio, 3);
      const currentVal = easedRatio * 100;

      setProgress(currentVal);

      // Only finish after reaching 5000ms AND data loading is complete
      const isReadyToComplete = elapsed >= MIN_DURATION && (!isLoading || currentVal >= 100);

      if (isReadyToComplete) {
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
      className="minimal-white-loader"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div className="minimal-loader-content">
        {/* Centered "Faheem" Text */}
        <h1 className="minimal-loader-brand">
          Faheem
        </h1>

        {/* Thin Animated Loading Bar Underneath */}
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
