import React, { useState, useEffect, useRef, memo } from "react";
import "./LazyImage.css";

/**
 * Instant-Performance Lazy Loader Component with CLS Prevention & Priority Pre-fetching
 */
const LazyImage = memo(function LazyImage({
  src,
  srcSet,
  sizes,
  alt = "",
  className = "",
  containerClassName = "",
  style = {},
  aspectRatio,
  priority = false,
  onClick,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (priority || isInView) return;
    if (!containerRef.current) return;

    // Use IntersectionObserver with 600px rootMargin to pre-fetch well before scrolling into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority, isInView]);

  const containerStyle = {
    position: "relative",
    overflow: "hidden",
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
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

      {/* Actual Image Tag with Instant & Priority Support */}
      {isInView && !hasError && (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`lazy-image-img ${isLoaded ? "loaded" : ""} ${className}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" } : {})}
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
});

export default LazyImage;

