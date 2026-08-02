import { useState, useEffect, useLayoutEffect, useCallback, lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Home from "./pages/Home";
import { ThemeProvider } from "./context/ThemeContext";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import Loader from "./components/common/Loader";
import Lenis from "lenis";
import ChatWidget from "./components/common/ChatWidget";
import ClickSpark from "./components/common/ClickSpark";
import CustomCursor from "./components/common/CustomCursor";
import ScrollToTop from "./components/common/ScrollToTop";

import { API_BASE } from "./config/api";

// Lazy-loaded Public Secondary Routes for optimal initial bundle size
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CaseStudyPage = lazy(() => import("./pages/CaseStudyPage"));

// Lazy-loaded Admin CMS Routes for optimal initial bundle size
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const Login = lazy(() => import("./admin/pages/Login"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const ProjectManager = lazy(() => import("./admin/pages/ProjectManager"));
const SectionManager = lazy(() => import("./admin/pages/SectionManager"));
const Inbox = lazy(() => import("./admin/pages/Inbox"));
const MediaLibrary = lazy(() => import("./admin/pages/MediaLibrary"));
const Profile = lazy(() => import("./admin/pages/Profile"));
const SiteStatus = lazy(() => import("./admin/pages/SiteStatus"));
const ShareBanner = lazy(() => import("./admin/pages/ShareBanner"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));

import { PageWrapper } from "./components/common/PageTransition";

// Protected Admin Router Wrapper
const ProtectedRoute = ({ children }) => {
  const { token } = useAdmin();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function AppContent() {
  const { siteSettings, isSettingsLoading, isProjectsLoading, token, user, isProfileLoading, setIsSiteLoaded } = useAdmin();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Track initial application loading lifecycle pass
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);
  const isDataLoading = isSettingsLoading || isProjectsLoading;
  const showLoader = !hasCompletedInitialLoad && !isAdminRoute;

  const handleLoaderComplete = useCallback(() => {
    setHasCompletedInitialLoad(true);
    setIsSiteLoaded(true);
  }, [setIsSiteLoaded]);

  useEffect(() => {
    if (isAdminRoute) {
      setHasCompletedInitialLoad(true);
      setIsSiteLoaded(true);
    }
  }, [isAdminRoute, setIsSiteLoaded]);

  // Strict maintenance mode check: ONLY true if explicitly enabled by admin in database/CMS settings
  const isMaintenanceMode = siteSettings?.global?.maintenanceMode === true;
  const isAdmin = !!token;

  // Toggle body class for admin routes so native mouse cursors are properly restored
  useEffect(() => {
    if (isAdminRoute) {
      document.body.classList.add('admin-body');
    } else {
      document.body.classList.remove('admin-body');
    }
  }, [isAdminRoute]);

  // Dynamically apply SEO settings from backend (Title, Favicon, Meta Description, Keywords, OG Tags)
  useEffect(() => {
    if (siteSettings) {
      const seo = siteSettings.seo || {};
      const globalSettings = siteSettings.global || {};

      const updateMetaTag = (selector, attributeName, attributeValue, contentValue) => {
        if (!contentValue) return;
        let tag = document.querySelector(selector);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute(attributeName, attributeValue);
          document.getElementsByTagName('head')[0].appendChild(tag);
        }
        tag.content = contentValue;
      };

      // Update Title & Open Graph Title
      if (seo.siteTitle) {
        document.title = seo.siteTitle;
        updateMetaTag("meta[property='og:title']", 'property', 'og:title', seo.siteTitle);
        updateMetaTag("meta[name='twitter:title']", 'name', 'twitter:title', seo.siteTitle);
      }

      // Update Favicon (supports jpg, png, ico, svg, webp, and remote image URLs)
      const faviconUrl = seo.favicon || globalSettings.favicon;
      if (faviconUrl) {
        // Remove existing icon links to prevent browser from prioritizing static SVG icons over dynamic CMS favicon
        const existingLinks = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
        existingLinks.forEach(el => el.remove());

        // Create main favicon link
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;

        const lowerUrl = faviconUrl.toLowerCase();
        if (lowerUrl.endsWith('.png')) {
          link.type = 'image/png';
        } else if (lowerUrl.endsWith('.ico')) {
          link.type = 'image/x-icon';
        } else if (lowerUrl.endsWith('.svg')) {
          link.type = 'image/svg+xml';
        } else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
          link.type = 'image/jpeg';
        } else if (lowerUrl.endsWith('.webp')) {
          link.type = 'image/webp';
        } else {
          link.type = 'image/x-icon';
        }

        document.head.appendChild(link);

        // Create apple-touch-icon link
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = faviconUrl;
        document.head.appendChild(appleLink);
      }

      // Update Meta Description & Social Descriptions
      if (seo.metaDescription) {
        updateMetaTag("meta[name='description']", 'name', 'description', seo.metaDescription);
        updateMetaTag("meta[property='og:description']", 'property', 'og:description', seo.metaDescription);
        updateMetaTag("meta[name='twitter:description']", 'name', 'twitter:description', seo.metaDescription);
      }

      // Update Keywords
      if (seo.keywords && seo.keywords.length > 0) {
        const keywordsStr = Array.isArray(seo.keywords) ? seo.keywords.join(', ') : seo.keywords;
        updateMetaTag("meta[name='keywords']", 'name', 'keywords', keywordsStr);
      }

    }
  }, [siteSettings]);

  // Dynamically update Share Banner Open Graph image meta tags & JSON-LD from dedicated endpoint
  useEffect(() => {
    let isMounted = true;
    const fetchShareBannerMeta = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings/share-banner?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            const imageUrl = data.banner?.imageUrl || '';
            const timestamp = data.banner?.updatedAt ? new Date(data.banner.updatedAt).getTime() : Date.now();
            const versionedUrl = imageUrl ? (imageUrl.includes('?') ? `${imageUrl}&v=${timestamp}` : `${imageUrl}?v=${timestamp}`) : '';
            
            const updateMeta = (selector, attrName, attrVal, contentVal) => {
              let tag = document.querySelector(selector);
              if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute(attrName, attrVal);
                document.head.appendChild(tag);
              }
              tag.content = contentVal;
            };

            updateMeta("meta[property='og:image']", 'property', 'og:image', versionedUrl);
            updateMeta("meta[property='og:image:secure_url']", 'property', 'og:image:secure_url', versionedUrl);
            updateMeta("meta[name='twitter:image']", 'name', 'twitter:image', versionedUrl);

            // Update JSON-LD structured data image
            const jsonLdScript = document.getElementById('json-ld-schema');
            if (jsonLdScript) {
              try {
                const schemaData = JSON.parse(jsonLdScript.textContent);
                schemaData.image = versionedUrl;
                jsonLdScript.textContent = JSON.stringify(schemaData, null, 2);
              } catch (err) {}
            }
          }
        }
      } catch (e) {
        console.warn('Share banner meta fetch error:', e);
      }
    };

    fetchShareBannerMeta();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isAdminRoute) return; // Disable Lenis on Admin Panel routes to prevent navigation/panel scroll conflicts

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Native fast-responsive deceleration
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);
    window.lenis = lenis;
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });

    // Smooth anchor navigation
    const handleAnchorScroll = (e) => {
      const target = e.target.closest("a");
      if (target && target.hash) {
        const targetElement = document.querySelector(target.hash);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement);
        }
      }
    };
    document.addEventListener("click", handleAnchorScroll);

    return () => {
      lenis.destroy();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener("click", handleAnchorScroll);
      window.lenis = null;
    };
  }, [isAdminRoute]);

  // Only display MaintenancePage if maintenance mode is explicitly enabled by administrator
  if (isMaintenanceMode === true && !isAdminRoute && !isAdmin) {
    return (
      <Suspense fallback={null}>
        <MaintenancePage />
      </Suspense>
    );
  }

  return (
    <>
      <ScrollToTop />
      {/* World-Class 2026 Glassmorphism Preloader */}
      <AnimatePresence mode="wait">
        {showLoader && (
          <Loader 
            key="site-loader" 
            isLoading={isDataLoading} 
            onComplete={handleLoaderComplete} 
          />
        )}
      </AnimatePresence>

      {!isAdminRoute && <CustomCursor />}
      {!isAdminRoute && <Navbar />}
      
      {isAdminRoute ? (
        <div className="admin-container" key="admin-content">
          <main>
            <Suspense fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#888', fontFamily: 'sans-serif', fontSize: '14px' }}>
                Loading Admin Panel...
              </div>
            }>
              <Routes location={location} key={location.pathname}>
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="projects" element={<ProjectManager />} />
                  <Route path="sections" element={<SectionManager />} />
                  <Route path="inbox" element={<Inbox />} />
                  <Route path="media" element={<MediaLibrary />} />
                  <Route path="settings/share-banner" element={<ShareBanner />} />
                  <Route path="share-banner" element={<ShareBanner />} />
                  <Route path="status" element={<SiteStatus />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Routes>
            </Suspense>
          </main>
        </div>
      ) : (
        <ClickSpark
          sparkColor="#8B5CF6"
          sparkSize={14}
          sparkRadius={24}
          sparkCount={10}
          duration={450}
        >
          <div className="app-container">
            <main className="main-content">
              <AnimatePresence 
                mode="wait"
                onExitComplete={() => {
                  window.scrollTo(0, 0);
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                  if (window.lenis) {
                    window.lenis.scrollTo(0, { immediate: true });
                  }
                }}
              >
                <Suspense fallback={null}>
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                    <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
                    <Route path="/projects" element={<PageWrapper><ProjectsPage /></PageWrapper>} />
                    <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                    <Route path="/case-study/:id" element={<PageWrapper><CaseStudyPage /></PageWrapper>} />
                  </Routes>
                </Suspense>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
          <ChatWidget />
        </ClickSpark>
      )}
    </>
  );
}

function App() {
  return (
    <AdminProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AdminProvider>
  );
}

export default App;