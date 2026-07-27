import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getOptimizedImageUrl } from "../../utils/imageOptimizer";
import "./GallerySlider.css";

const makeVariants = (direction) => ({
    enter: { x: direction > 0 ? "60%" : "-60%", opacity: 0, scale: 0.97 },
    center: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
    exit: { x: direction > 0 ? "-60%" : "60%", opacity: 0, scale: 0.97, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
});

function Lightbox({ images, startIndex, onClose }) {
    const [index, setIndex] = useState(startIndex);
    const [zoom, setZoom] = useState(1);
    const [direction, setDirection] = useState(1);
    const lastPinchDist = useRef(null);

    const total = images.length;

    const prev = useCallback(() => { setDirection(-1); setZoom(1); setIndex((i) => (i - 1 + total) % total); }, [total]);
    const next = useCallback(() => { setDirection(1); setZoom(1); setIndex((i) => (i + 1) % total); }, [total]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, prev, next]);

    const onWheel = (e) => {
        e.preventDefault();
        setZoom((z) => Math.min(Math.max(z - e.deltaY * 0.003, 1), 4));
    };

    const lightboxTouchStartX = useRef(null);

    const onTouchStart = (e) => {
        if (e.touches.length === 1) {
            lightboxTouchStartX.current = e.touches[0].clientX;
        } else if (e.touches.length === 2) {
            lastPinchDist.current = Math.hypot(
                e.touches[1].clientX - e.touches[0].clientX,
                e.touches[1].clientY - e.touches[0].clientY
            );
        }
    };

    const onTouchMove = (e) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
            const delta = dist - (lastPinchDist.current || dist);
            lastPinchDist.current = dist;
            setZoom((z) => Math.min(Math.max(z + delta * 0.01, 1), 4));
        }
    };

    const onTouchEnd = (e) => {
        if (lightboxTouchStartX.current !== null && e.changedTouches.length === 1 && zoom === 1) {
            const delta = e.changedTouches[0].clientX - lightboxTouchStartX.current;
            if (Math.abs(delta) > 40) {
                if (delta < 0) {
                    next();
                } else {
                    prev();
                }
            }
        }
        lightboxTouchStartX.current = null;
    };

    const variants = makeVariants(direction);

    return (
        <motion.div className="gs-lightbox-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose}>
            <div className="gs-lightbox-counter" onClick={(e) => e.stopPropagation()}>{index + 1} / {total}</div>
            <button className="gs-lightbox-close" onClick={onClose} aria-label="Close lightbox">x</button>
            {total > 1 && <button className="gs-lightbox-nav gs-lightbox-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">&lt;</button>}
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div key={index} className="gs-lightbox-img-wrap" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" onClick={(e) => e.stopPropagation()} onWheel={onWheel} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                    <motion.img src={getOptimizedImageUrl(images[index], { width: 1600, quality: 95 })} alt={`Lightbox image ${index + 1}`} className="gs-lightbox-img" draggable={false} animate={{ scale: zoom }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                </motion.div>
            </AnimatePresence>
            {total > 1 && <button className="gs-lightbox-nav gs-lightbox-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">&gt;</button>}
        </motion.div>
    );
}

export default function GallerySlider({ images = [], fallbackImage = null, alt = "Gallery" }) {
    const imgs = (() => {
        if (images && images.length > 0) return images;
        if (fallbackImage) return [fallbackImage];
        return [];
    })();

    const total = imgs.length;
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);
    const [paused, setPaused] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const touchStartX = useRef(null);
    const thumbnailsRef = useRef(null);

    const goTo = useCallback((idx, dir) => {
        setDirection(dir ?? (idx > current ? 1 : -1));
        setCurrent(((idx % total) + total) % total);
    }, [current, total]);

    const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);
    const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);

    useEffect(() => {
        if (total <= 1 || paused) return;
        const id = setInterval(() => { setDirection(1); setCurrent((c) => (c + 1) % total); }, 5000);
        return () => clearInterval(id);
    }, [total, paused]);

    useEffect(() => {
        if (lightboxOpen) return;
        const onKey = (e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxOpen, prev, next]);

    useEffect(() => {
        const el = thumbnailsRef.current;
        if (!el) return;
        const thumb = el.children[current];
        if (thumb) thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [current]);

    useEffect(() => {
        if (total <= 1) return;
        const nextIdx = (current + 1) % total;
        const img = new window.Image();
        img.src = imgs[nextIdx];
    }, [current, imgs, total]);

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 40) {
            if (delta < 0) {
                next();
            } else {
                prev();
            }
        }
        touchStartX.current = null;
    };

    if (total === 0) return null;

    const variants = makeVariants(direction);

    return (
        <>
            <div className="gs-root" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                <div className="gs-main">
                    {total > 1 && <div className="gs-counter">{current + 1} / {total}</div>}
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div key={current} className="gs-slide" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" style={{ willChange: "transform, opacity" }}>
                            <img src={getOptimizedImageUrl(imgs[current], { width: 1400, quality: 90 })} alt={`${alt} ${current + 1}`} className="gs-slide-img" loading="lazy" decoding="async" onClick={() => { setLightboxIndex(current); setLightboxOpen(true); }} />
                        </motion.div>
                    </AnimatePresence>
                    {total > 1 && (
                        <>
                            <button className="gs-nav gs-nav-prev" onClick={prev} aria-label="Previous">&lt;</button>
                            <button className="gs-nav gs-nav-next" onClick={next} aria-label="Next">&gt;</button>
                        </>
                    )}
                </div>
                {total > 1 && (
                    <div className="gs-thumbs" ref={thumbnailsRef}>
                        {imgs.map((src, i) => (
                            <button key={i} className={`gs-thumb${i === current ? " gs-thumb-active" : ""}`} onClick={() => goTo(i)} aria-label={`View image ${i + 1}`}>
                                <img src={getOptimizedImageUrl(src, { width: 160, quality: 70 })} alt={`Thumbnail ${i + 1}`} loading="lazy" decoding="async" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <AnimatePresence>
                {lightboxOpen && <Lightbox images={imgs} startIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />}
            </AnimatePresence>
        </>
    );
}