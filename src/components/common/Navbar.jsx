import { useState, useEffect } from "react";
import "./Navbar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useAdmin } from "../../context/AdminContext";
import { FiSun, FiMoon } from "react-icons/fi";
import Magnetic from "./Magnetic";

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const isHomePage = location.pathname === "/";
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme, showToggle } = useTheme();
    const [activeSection, setActiveSection] = useState("home");
    const [scrolled, setScrolled] = useState(false);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Scroll-aware navbar state
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll(); // run once on mount
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Prevent body scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    // Handle cross-page scrolling to sections on mount/location change
    useEffect(() => {
        if (location.pathname === "/" && location.state?.scrollToId) {
            const targetId = location.state.scrollToId;
            // Clear state so it doesn't trigger scroll on page refreshes or navigation back
            window.history.replaceState({}, document.title);

            setTimeout(() => {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                }
            }, 100);
        }
    }, [location]);

    // Track active scroll section on homepage
    useEffect(() => {
        if (!isHomePage) return;

        const sections = ["home", "about"];
        const observerOptions = {
            root: null,
            rootMargin: "-45% 0px -45% 0px", // Trigger when section occupies center
            threshold: 0,
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                observer.observe(el);
            }
        });

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < 80) {
                setActiveSection("home");
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", handleScroll);
        };
    }, [isHomePage, location.pathname]);

    const handleNavClick = (e, link) => {
        if (!link.isRouter) {
            e.preventDefault();
            const targetId = link.href.includes("#") ? link.href.split("#")[1] : null;
            if (targetId) {
                if (isHomePage) {
                    const element = document.getElementById(targetId);
                    if (element) {
                        if (window.lenis) {
                            window.lenis.scrollTo(element);
                        } else {
                            element.scrollIntoView({ behavior: "smooth" });
                        }
                    }
                } else {
                    navigate("/", { state: { scrollToId: targetId } });
                }
            }
        }
        setMenuOpen(false);
    };

    const { siteSettings, user, token, downloadCv } = useAdmin();
    const navSettings = siteSettings?.navbar || {};

    const isLinkActive = (link) => {
        if (link.isRouter) {
            return location.pathname === link.href;
        } else {
            const targetId = link.href.includes("#") ? link.href.split("#")[1] : null;
            return isHomePage && activeSection === targetId;
        }
    };

    const navLinks = [
        { label: "Home",     href: isHomePage ? "#home"    : "/#home",    isRouter: false },
        { label: "About",    href: "/about",                               isRouter: true  },
        { label: "Projects", href: "/projects",                            isRouter: true  },
        { label: "Contact",  href: "/contact",                             isRouter: true  },
    ];

    const isAdminLoggedIn = !!(token && (!user || user.role === "admin"));

    return (
        <>
            <header className={`navbar${scrolled ? " navbar--scrolled" : ""}${isAdminLoggedIn ? " navbar--admin-logged" : ""}`}>
                <div className="nav-container">

                    <Magnetic strength={0.15}>
                        <Link to="/" className="logo">
                            {navSettings.logoText || "FAHEEM"}
                        </Link>
                    </Magnetic>

                    {/* Desktop nav */}
                    <nav className="nav-links">
                        {navLinks.map(link => link.isRouter ? (
                            <Magnetic key={link.label} strength={0.25}>
                                <Link
                                    to={link.href}
                                    className={isLinkActive(link) ? "active" : ""}
                                >
                                    {link.label}
                                </Link>
                            </Magnetic>
                        ) : (
                            <Magnetic key={link.label} strength={0.25}>
                                <a 
                                    href={link.href}
                                    className={isLinkActive(link) ? "active" : ""}
                                    onClick={(e) => handleNavClick(e, link)}
                                >
                                    {link.label}
                                </a>
                            </Magnetic>
                        ))}
                    </nav>

                    <div className="nav-actions">
                        {/* Theme Toggle Button - Desktop only */}
                        {showToggle !== false && (
                            <div className="nav-theme-toggle-wrap">
                                <Magnetic strength={0.2}>
                                    <button 
                                        className="nav-theme-toggle" 
                                        onClick={toggleTheme} 
                                        aria-label="Toggle theme"
                                    >
                                        {theme === "dark" ? <FiSun style={{ color: "#fbbf24" }} /> : <FiMoon style={{ color: "#6366f1" }} />}
                                    </button>
                                </Magnetic>
                            </div>
                        )}

                        {token && (!user || user.role === 'admin') && (
                            <Magnetic strength={0.2}>
                                <Link to="/admin" className="nav-admin-btn">
                                    <svg className="admin-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                    </svg>
                                    <span>Admin Panel</span>
                                    <span className="admin-btn-badge">Admin</span>
                                </Link>
                            </Magnetic>
                        )}

                        {(!navSettings || navSettings.downloadCvBtnVisible !== false) && (
                            <Magnetic strength={0.2}>
                                <a href="#download-cv" onClick={(e) => { e.preventDefault(); downloadCv(); }} className="nav-btn">
                                    {navSettings.downloadCvBtnText || "Download CV"}
                                </a>
                            </Magnetic>
                        )}

                        {/* Hamburger — mobile only */}
                        <button
                            className={`hamburger ${menuOpen ? "open" : ""}`}
                            onClick={() => setMenuOpen(v => !v)}
                            aria-label="Toggle menu"
                            aria-expanded={menuOpen}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>

                </div>
            </header>

            {/* Mobile drawer */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="mobile-backdrop"
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            onClick={() => setMenuOpen(false)}
                        />

                        {/* Drawer panel */}
                        <motion.div
                            className="mobile-menu"
                            key="drawer"
                            initial={{ opacity: 0, y: -20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <nav className="mobile-nav-links">
                                {navLinks.map((link, idx) => link.isRouter ? (
                                    <motion.div
                                        key={link.label}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.07, duration: 0.3 }}
                                    >
                                        <Link
                                            to={link.href}
                                            className={`mobile-nav-link ${isLinkActive(link) ? "active" : ""}`}
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={link.label}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.07, duration: 0.3 }}
                                    >
                                        <a
                                            href={link.href}
                                            className={`mobile-nav-link ${isLinkActive(link) ? "active" : ""}`}
                                            onClick={(e) => handleNavClick(e, link)}
                                        >
                                            {link.label}
                                        </a>
                                    </motion.div>
                                ))}
                            </nav>

                            <div className="mobile-menu-footer">
                                {token && (!user || user.role === 'admin') && (
                                    <Link to="/admin" className="mobile-admin-btn" onClick={() => setMenuOpen(false)}>
                                        <svg className="admin-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                        </svg>
                                        <span>Admin Panel</span>
                                        <span className="admin-btn-badge">Admin</span>
                                    </Link>
                                )}
                                <a href="#download-cv" onClick={(e) => { e.preventDefault(); downloadCv(); }} className="mobile-cv-btn">
                                    Download CV
                                </a>
                                {showToggle !== false && (
                                    <button 
                                        className="mobile-theme-toggle" 
                                        onClick={() => { toggleTheme(); setMenuOpen(false); }} 
                                        aria-label="Toggle theme"
                                    >
                                        {theme === "dark" ? <FiSun style={{ color: "#fbbf24" }} /> : <FiMoon style={{ color: "#6366f1" }} />}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default Navbar;