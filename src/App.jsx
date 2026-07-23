import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import ProjectsPage from "./pages/ProjectsPage";
import ContactPage from "./pages/ContactPage";
import CaseStudyPage from "./pages/CaseStudyPage";
import { ThemeProvider } from "./context/ThemeContext";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import Loader from "./components/common/Loader";
import Lenis from "lenis";
import ChatWidget from "./components/common/ChatWidget";
import ClickSpark from "./components/common/ClickSpark";
import CustomCursor from "./components/common/CustomCursor";


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
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -15, filter: "blur(6px)" }
};

const PageWrapper = ({ children }) => {
  useEffect(() => {
    window.lenis?.scrollTo(0, { immediate: true });
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Protected Admin Router Wrapper
const ProtectedRoute = ({ children }) => {
  const { token } = useAdmin();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function AppContent() {
  const { siteSettings, isSettingsLoading, token, user, isProfileLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const isMaintenanceMode = siteSettings?.global?.maintenanceMode === true;
  const isAdmin = !!token && user?.role === 'admin';
  const showLoader = loading && !isAdminRoute;

  // Toggle body class for admin routes so native mouse cursors are properly restored
  useEffect(() => {
    if (isAdminRoute) {
      document.body.classList.add('admin-body');
    } else {
      document.body.classList.remove('admin-body');
    }
  }, [isAdminRoute]);

  // Dynamically apply SEO settings from backend (Title, Favicon, Meta Description, Keywords)
  useEffect(() => {
    if (siteSettings) {
      const seo = siteSettings.seo || {};
      const globalSettings = siteSettings.global || {};
      const faviconUrl = globalSettings.favicon || seo.favicon;

      // Update Title
      if (seo.siteTitle) {
        document.title = seo.siteTitle;
      }

      // Update Favicon
      if (faviconUrl) {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = faviconUrl;

        // Dynamically adjust type attribute to match the uploaded format
        if (faviconUrl.endsWith('.png')) {
          link.type = 'image/png';
        } else if (faviconUrl.endsWith('.ico')) {
          link.type = 'image/x-icon';
        } else if (faviconUrl.endsWith('.svg')) {
          link.type = 'image/svg+xml';
        } else {
          link.removeAttribute('type');
        }
      }

      // Update Meta Description
      if (seo.metaDescription) {
        let metaDesc = document.querySelector("meta[name='description']");
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.getElementsByTagName('head')[0].appendChild(metaDesc);
        }
        metaDesc.content = seo.metaDescription;
      }

      // Update Keywords
      if (seo.keywords && seo.keywords.length > 0) {
        let metaKeywords = document.querySelector("meta[name='keywords']");
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.name = 'keywords';
          document.getElementsByTagName('head')[0].appendChild(metaKeywords);
        }
        metaKeywords.content = Array.isArray(seo.keywords) ? seo.keywords.join(', ') : seo.keywords;
      }
    }
  }, [siteSettings]);

  useEffect(() => {
    if (isAdminRoute) return; // Disable Lenis on Admin Panel routes to prevent navigation/panel scroll conflicts

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const lenis = new Lenis({
      lerp: 0.08, // Buttery smooth interpolation for ultra-premium native feel
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);
    window.lenis = lenis;

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
        cancelAnimationFrame(rafId); // Correctly clean up the loop to prevent memory/CPU leaks
      }
      document.removeEventListener("click", handleAnchorScroll);
      window.lenis = null;
    };
  }, [isAdminRoute]);

  if (isMaintenanceMode && !isAdminRoute && !isAdmin && !showLoader) {
    return (
      <Suspense fallback={null}>
        <MaintenancePage />
      </Suspense>
    );
  }

  return (
    <>
      {!isAdminRoute && <CustomCursor />}
      {!isAdminRoute && <Navbar />}
      
      <AnimatePresence mode="wait">
        {showLoader ? (
          <Loader key="loader" isLoading={isSettingsLoading || isProfileLoading} onComplete={() => setLoading(false)} />
        ) : isAdminRoute ? (
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
            <motion.div 
              key="content"
              className="app-container"
              initial={{ opacity: 0, filter: "blur(12px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <main className="main-content">
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                    <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
                    <Route path="/projects" element={<PageWrapper><ProjectsPage /></PageWrapper>} />
                    <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
                    <Route path="/case-study/:id" element={<PageWrapper><CaseStudyPage /></PageWrapper>} />
                  </Routes>
                </AnimatePresence>
              </main>
              <Footer />
            </motion.div>
            <ChatWidget />
          </ClickSpark>
        )}
      </AnimatePresence>
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