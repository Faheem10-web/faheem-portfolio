import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, state } = useLocation();
  const prevPathname = useRef(pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Disable browser's auto scroll restoration on mount
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // If state contains scrollToId, anchor navigation is handled by Navbar
    if (state?.scrollToId) {
      prevPathname.current = pathname;
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      window.scrollTo(0, 0);
      if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
      }
      return;
    }

    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      // Scroll smoothly to top on route change
      if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: false });
      } else {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth"
        });
      }
    }
  }, [pathname, state]);

  return null;
}
