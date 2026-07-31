import { useRef, memo, useCallback } from "react";

/**
 * ============================================================================
 * PERFORMANCE OPTIMIZATION (Magnetic Component):
 * 1. Caches bounding client rect on `mouseenter` to eliminate repeated calls
 *    to `getBoundingClientRect()` inside `mousemove` handlers. This completely
 *    prevents forced synchronous layouts and layout thrashing in Chrome.
 * 2. Throttles DOM transform updates via `requestAnimationFrame` using a ticking flag
 *    to prevent duplicate RAF frame queuing.
 * 3. Uses GPU 3D transform (`translate3d`) for hardware accelerated compositing.
 * ============================================================================
 */
const Magnetic = memo(function Magnetic({ children, strength = 0.3 }) {
  const ref = useRef(null);
  const rectRef = useRef(null);
  const rafRef = useRef(null);
  const tickingRef = useRef(false);
  const targetPosRef = useRef({ x: 0, y: 0 });

  // Cache element dimensions on hover start to avoid forced reflows during mousemove
  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    
    // Fallback if rect was not populated on enter
    if (!rectRef.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }

    const { clientX, clientY } = e;
    const { left, top, width, height } = rectRef.current;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    targetPosRef.current.x = (clientX - centerX) * strength;
    targetPosRef.current.y = (clientY - centerY) * strength;

    // RAF throttling to eliminate unnecessary DOM transform writes
    if (!tickingRef.current) {
      tickingRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transform = `translate3d(${targetPosRef.current.x}px, ${targetPosRef.current.y}px, 0)`;
        }
        tickingRef.current = false;
      });
    }
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      tickingRef.current = false;
    }
    rectRef.current = null;
    if (ref.current) {
      ref.current.style.transform = "translate3d(0px, 0px, 0)";
    }
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        display: "inline-block",
        willChange: "transform",
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
});

export default Magnetic;
