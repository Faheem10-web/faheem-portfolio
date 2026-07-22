import React, { useState } from "react";
import "./Footer.css";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import {
    FaInstagram, FaGithub, FaFacebookF, FaDribbble, FaLinkedinIn, FaBehance, FaArrowUp, FaCheck, FaCopy
} from "react-icons/fa";
import Magnetic from "./Magnetic";

function Footer() {
    const { siteSettings } = useAdmin();
    const footerSettings = siteSettings?.footer || {};
    const contactSettings = siteSettings?.contact || {};
    
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const [copied, setCopied] = useState(false);

    const email = contactSettings.email || "hello.andro@gmail.com";

    const handleCopyEmail = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const navItems = [
        { label: "Home", path: "/" },
        { label: "About", path: "/about" },
        { label: "Portfolio", path: "/projects" },
        { label: "Contact", path: "/contact" }
    ];

    return (
        <footer className="footer-wrapper">
            {/* ── FLOATING DARK CARD ── */}
            <div className="footer-card">
                {/* Ambient Purple Glow Orb */}
                <div className="footer-card-glow" aria-hidden="true" />

                {/* Subtitle / Tagline */}
                <span className="footer-subtitle">
                    {footerSettings.subtitle || "Let's turn your ideas into a stunning reality."}
                </span>

                {/* Main Email Headline */}
                <div className="footer-email-container">
                    <a href={`mailto:${email}`} className="footer-email-link">
                        {email}
                    </a>
                    <button 
                        onClick={handleCopyEmail} 
                        className="footer-copy-btn" 
                        title="Copy Email"
                        aria-label="Copy Email"
                    >
                        {copied ? <FaCheck className="copy-icon copied" /> : <FaCopy className="copy-icon" />}
                    </button>

                    <AnimatePresence>
                        {copied && (
                            <motion.span
                                className="copy-toast"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                Email copied to clipboard!
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Pill Navigation Bar */}
                <nav className="footer-pill-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`footer-nav-pill ${isActive ? "active" : ""}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* ── BOTTOM UTILITY BAR ── */}
            <div className="footer-bottom-bar">
                <div className="footer-left-text">
                    Theme created by <strong>{footerSettings.authorName || "Faheem"}</strong>
                </div>

                <button onClick={scrollToTop} className="footer-back-to-top" aria-label="Back to Top">
                    Back to Top <FaArrowUp className="top-arrow-icon" />
                </button>

                <div className="footer-social-circles">
                    {contactSettings.behanceUrl && (
                        <Magnetic strength={0.25}>
                            <a href={contactSettings.behanceUrl} target="_blank" rel="noreferrer" aria-label="Behance">
                                <FaBehance />
                            </a>
                        </Magnetic>
                    )}
                    <Magnetic strength={0.25}>
                        <a href={contactSettings.dribbbleUrl || "https://dribbble.com"} target="_blank" rel="noreferrer" aria-label="Dribbble">
                            <FaDribbble />
                        </a>
                    </Magnetic>
                    <Magnetic strength={0.25}>
                        <a href={contactSettings.linkedinUrl || "https://linkedin.com"} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                            <FaLinkedinIn />
                        </a>
                    </Magnetic>
                    <Magnetic strength={0.25}>
                        <a href={contactSettings.facebookUrl || "https://facebook.com"} target="_blank" rel="noreferrer" aria-label="Facebook">
                            <FaFacebookF />
                        </a>
                    </Magnetic>
                    <Magnetic strength={0.25}>
                        <a href={contactSettings.instagramUrl || "https://instagram.com"} target="_blank" rel="noreferrer" aria-label="Instagram">
                            <FaInstagram />
                        </a>
                    </Magnetic>
                    {contactSettings.githubUrl && (
                        <Magnetic strength={0.25}>
                            <a href={contactSettings.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
                                <FaGithub />
                            </a>
                        </Magnetic>
                    )}
                </div>
            </div>
        </footer>
    );
}

export default Footer;