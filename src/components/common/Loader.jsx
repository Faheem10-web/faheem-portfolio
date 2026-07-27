import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Loader.css";
import { useAdmin } from "../../context/AdminContext";

const DEFAULT_LOADER_IMAGES = [
  "https://i.pinimg.com/736x/a6/04/e7/a604e74d0108469186735da09cb8b7e6.jpg",
  "https://i.pinimg.com/736x/c6/e2/b2/c6e2b216d67d3deedfeff6e2e181038f.jpg",
  "https://i.pinimg.com/736x/17/7e/db/177edbbc78c1d17363e18c5693613218.jpg",
  "https://i.pinimg.com/736x/7a/97/38/7a97384d195ba349c5245e6db457788f.jpg",
  "https://i.pinimg.com/1200x/20/7e/e0/207ee0bbb640685969f306484df1a2dc.jpg",
];

const containerVariants = {
  initial: { opacity: 1 },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const frameVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.1,
    },
  },
};

export default function Loader({ onComplete, isLoading }) {
  const { siteSettings } = useAdmin();
  const [progress, setProgress] = useState(0);
  const [dotCount, setDotCount] = useState(2);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const completedRef = useRef(false);

  const loaderTitleText = siteSettings?.global?.loaderTitle || "LOADING";
  const rawSubtitle = siteSettings?.global?.loaderText || "UI / UX DESIGNER & FRONTEND DEVELOPER";

  // Support single title or comma-separated list of changing words
  const subtitleList = typeof rawSubtitle === "string" && rawSubtitle.includes(",")
    ? rawSubtitle.split(",").map((s) => s.trim()).filter(Boolean)
    : [rawSubtitle];

  // Dynamic admin panel slideshow images (loaderImage1..5) with fallbacks
  const dynamicImages = [
    siteSettings?.global?.loaderImage1,
    siteSettings?.global?.loaderImage2,
    siteSettings?.global?.loaderImage3,
    siteSettings?.global?.loaderImage4,
    siteSettings?.global?.loaderImage5,
  ].filter(Boolean);

  let loaderImages = DEFAULT_LOADER_IMAGES;
  if (dynamicImages.length > 0) {
    loaderImages = dynamicImages;
  } else if (siteSettings?.global?.loaderImages) {
    const custom = siteSettings.global.loaderImages;
    if (Array.isArray(custom) && custom.length > 0) {
      loaderImages = custom;
    } else if (typeof custom === "string" && custom.trim()) {
      loaderImages = custom.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else if (siteSettings?.global?.loaderImage) {
    loaderImages = [siteSettings.global.loaderImage];
  }

  // Preload images immediately on mount for zero-flicker transitions
  useEffect(() => {
    loaderImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [loaderImages]);

  // Continuously animate loading dots (LOADING. -> LOADING.. -> LOADING...)
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  // 60 FPS smooth progress calculation using requestAnimationFrame
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      if (onComplete) onComplete();
      return;
    }

    const DURATION = 1000; // 1.0 second fast, sleek, lightweight loader sequence

    const updateProgress = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      const linearRatio = Math.min(elapsed / DURATION, 1);
      const easedRatio =
        linearRatio < 0.5
          ? 4 * linearRatio * linearRatio * linearRatio
          : 1 - Math.pow(-2 * linearRatio + 2, 3) / 2;

      let currentVal = easedRatio * 100;

      // Safety cap at 98% only if backend is still actively loading within safety window
      if (isLoading && elapsed < 1400 && currentVal > 98) {
        currentVal = 98;
      }

      setProgress(currentVal);

      if (currentVal < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else if (!completedRef.current) {
        completedRef.current = true;
        // Fast 100ms pause after 100% before starting fade-out reveal
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 100);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLoading, onComplete]);

  const dots = ".".repeat(dotCount);
  const formattedProgress = Math.round(progress).toString().padStart(2, "0");
  const isSubtitleVisible = progress >= 40;

  // Compute active image index and active subtitle word based on progress
  const currentImageIndex = Math.min(
    Math.floor((progress / 100) * loaderImages.length),
    loaderImages.length - 1
  );

  const currentSubtitleIndex = Math.min(
    Math.floor((progress / 100) * subtitleList.length),
    subtitleList.length - 1
  );
  const currentSubtitle = subtitleList[currentSubtitleIndex];

  return (
    <motion.div
      className="editorial-loader-wrapper"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* 12-Column Architectural Layout Grid Overlay (Opacity 4%) */}
      <div className="editorial-loader-grid">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="editorial-grid-col" />
        ))}
      </div>

      {/* Main Canvas Grid Layout */}
      <div className="editorial-loader-content">
        {/* TOP LEFT: LOADING.. */}
        <div className="loader-top-left">
          <span className="loader-title">{loaderTitleText}{dots}</span>
        </div>

        {/* CENTER RIGHT: Percentage + Progress Bar */}
        <div className="loader-center-right">
          <div className="loader-percentage">{formattedProgress}%</div>
          <div className="loader-progress-track">
            <div
              className="loader-progress-fill"
              style={{
                transform: `scaleX(${progress / 100})`,
              }}
            />
          </div>
        </div>

        {/* BOTTOM LEFT: Editorial Architectural Image (4:3) with 5 Image Changing Mode */}
        <div className="loader-bottom-left">
          <motion.div
            className="editorial-image-frame"
            variants={frameVariants}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence mode="popLayout">
              <motion.img
                key={loaderImages[currentImageIndex]}
                src={loaderImages[currentImageIndex]}
                alt={`Editorial Architecture ${currentImageIndex + 1}`}
                className="editorial-image"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>
          </motion.div>
        </div>

        {/* BOTTOM RIGHT: Small Editorial Subtitle (Fade in after 40% with changing words support) */}
        <div className="loader-bottom-right">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentSubtitle}
              className="loader-subtitle"
              style={{
                opacity: isSubtitleVisible ? 1 : 0,
              }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: isSubtitleVisible ? 1 : 0, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentSubtitle}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
