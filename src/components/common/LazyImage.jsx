import React, { useState, useEffect, useRef } from "react";
import "./LazyImage.css";

/**
 * 2026-Level Ultra-Performance Lazy Loader Component
 * Features IntersectionObserver pre-fetching, shimmer placeholders,
 * and hardware-accelerated blur-up reveal transitions.
 */
export default function LazyImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  style = {},
  aspectRatio,
  onClick,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use IntersectionObserver for viewport lazy loading with 200px threshold
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const containerStyle = {
    ...style,
    ...(aspectRatio ? { aspectRatio } : {}),
  };

  return (
    <div
      ref={containerRef}
      className={`lazy-image-container ${containerClassName}`}
      style={containerStyle}
      onClick={onClick}
    >
      {/* Skeleton Shimmer Overlay */}
      {!isLoaded && !hasError && (
        <div className={`lazy-image-placeholder ${isLoaded ? "hidden" : ""}`} />
      )}

      {/* Actual Image Tag with Blur-up Reveal */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image-img ${isLoaded ? "loaded" : ""} ${className}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          decoding="async"
          loading="lazy"
          {...props}
        />
      )}

      {/* Fallback state on load error */}
      {hasError && (
        <div className="lazy-image-error">
          <span>Failed to load</span>
        </div>
      )}
    </div>
  );
}
