import { useLayoutEffect, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Global Route Scroll Restoration Component
 * Automatically resets scroll position to top (scrollTop: 0) on every internal route navigation.
 * Synchronous useLayoutEffect prevents visual jumps or frame flicker.
 */
export default function ScrollToTop() {
  const { pathname, state } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Disable browser's native automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    // If location state contains scrollToId, cross-page anchor scrolling is handled by Navbar
    if (state?.scrollToId) {
      prevPathname.current = pathname;
      return;
    }

    prevPathname.current = pathname;

    // Reset window and document scroll immediately before paint
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Reset Lenis smooth scroll engine position immediately
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname, state]);

  return null;
}
