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
    if (mediaQuery.matches || !isLoading) {
      if (onComplete) onComplete();
      return;
    }

    const DURATION = 220; // Ultra-fast under 300ms sequence

    const updateProgress = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearRatio = Math.min(elapsed / DURATION, 1);

      // Smooth soft easing curve (cubic ease-out)
      const easedRatio = 1 - Math.pow(1 - linearRatio, 3);
      const currentVal = easedRatio * 100;

      setProgress(currentVal);

      if (currentVal >= 100 || !isLoading) {
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
    >
      <div className="minimal-loader-content">
        {/* Bold Centered FAHEEM Text */}
        <h1 className="minimal-loader-brand">
          FAHEEM
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
