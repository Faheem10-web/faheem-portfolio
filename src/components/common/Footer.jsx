import React, { useState } from "react";
import "./Footer.css";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import {
    FiHome,
    FiUser,
    FiBriefcase,
    FiMail,
    FiGlobe,
    FiArrowUp,
    FiCopy,
    FiCheck
} from "react-icons/fi";
import {
    FaLinkedinIn,
    FaFacebookF,
    FaInstagram,
    FaWhatsapp,
    FaDribbble,
    FaGithub,
    FaTwitter
} from "react-icons/fa";
import Magnetic from "./Magnetic";

function Footer() {
    const { siteSettings } = useAdmin();
    const footerSettings = siteSettings?.footer || {};
    const contactSettings = siteSettings?.contact || {};
    
    const location = useLocation();
    const [copied, setCopied] = useState(false);

    const bgImage = footerSettings.bgImage || "/assets/footer_sky_bg.png";
    const email = footerSettings.contactEmail || contactSettings.email || "avfaheeeem@gmail.com";

    const githubUrl = footerSettings.githubUrl || contactSettings.githubUrl || "https://github.com";
    const linkedinUrl = footerSettings.linkedinUrl || contactSettings.linkedinUrl || "https://linkedin.com";
    const facebookUrl = footerSettings.facebookUrl || contactSettings.facebookUrl || "https://facebook.com";
    const instagramUrl = footerSettings.instagramUrl || contactSettings.instagramUrl || "https://instagram.com";
    const whatsappUrl = footerSettings.whatsappUrl || contactSettings.whatsappUrl || "https://wa.me/917356164236";
    const dribbbleUrl = footerSettings.dribbbleUrl || contactSettings.dribbbleUrl || "https://dribbble.com";
    const twitterUrl = footerSettings.twitterUrl || contactSettings.twitterUrl || "";

    // Email heading text color: 'dark' = #0d0d12 (black), 'white' = #ffffff
    const emailColorMode = footerSettings.emailTextColor || 'dark';
    const emailTextColor = emailColorMode === 'white' ? '#ffffff' : '#0d0d12';

    // Dynamic Blur & Brightness filters (Unified Master Blur for Background & Bottom Bar)
    const bgBlur = footerSettings.bgBlur !== undefined ? Number(footerSettings.bgBlur) : 12;
    const bgBrightness = footerSettings.bgBrightness !== undefined ? Number(footerSettings.bgBrightness) : 100;

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
        { label: "Home", path: "/", icon: FiHome },
        { label: "About", path: "/about", icon: FiUser },
        { label: "Portfolio", path: "/projects", icon: FiBriefcase },
        { label: "Contact", path: "/contact", icon: FiMail }
    ];

    return (
        <footer className="footer-wrapper">
            {/* ── FLOATING LIQUID GLASS CONTAINER CARD ── */}
            <div className="footer-card">
                {/* Background Image Layer contained ONLY inside Card */}
                <div className="footer-card-bg" aria-hidden="true">
                    <img 
                        src={bgImage} 
                        alt="" 
                        className="footer-card-bg-img"
                        referrerPolicy="no-referrer"
                        style={{
                            filter: `blur(${bgBlur}px) brightness(${bgBrightness}%)`
                        }}
                        onError={(e) => {
                            if (!e.target.src.includes('/assets/footer_sky_bg.png')) {
                                e.target.src = '/assets/footer_sky_bg.png';
                            }
                        }}
                    />
                </div>

                {/* Ambient Lavender & Pink Glow Orbs */}
                <div className="footer-glow-orb orb-left" aria-hidden="true" />
                <div className="footer-glow-orb orb-right" aria-hidden="true" />

                {/* ── CARD TOP SECTION ── */}
                <div className="footer-card-top">
                    {/* Glass Copy Button anchored in Top-Right Corner */}
                    <button 
                        onClick={handleCopyEmail} 
                        className="footer-copy-btn" 
                        title="Copy Email"
                        aria-label="Copy Email"
                    >
                        {copied ? <FiCheck className="copy-icon copied" /> : <FiCopy className="copy-icon" />}
                    </button>

                    {/* Giant Center Email */}
                    <div className="footer-email-container">
                        <a href={`mailto:${email}`} className="footer-email-link" style={{ color: emailTextColor }}>
                            {email}
                        </a>

                        <AnimatePresence>
                            {copied && (
                                <motion.span
                                    className="copy-toast"
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                >
                                    Email copied!
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pill Navigation Bar */}
                    <nav className="footer-pill-nav">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const IconComp = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`footer-nav-pill ${isActive ? "active" : ""}`}
                                >
                                    <IconComp className="pill-nav-icon" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* ── CARD BOTTOM SUB-FOOTER ROW (INTEGRATED INSIDE CARD - SYNCED WITH MASTER BLUR) ── */}
                <div 
                    className="footer-card-bottom"
                    style={{
                        backdropFilter: `blur(${bgBlur}px)`,
                        WebkitBackdropFilter: `blur(${bgBlur}px)`
                    }}
                >
                    <button onClick={scrollToTop} className="footer-back-to-top" aria-label="Back to Top">
                        <span>Back to Top</span>
                        <FiArrowUp className="top-arrow-icon" />
                    </button>

                    <div className="footer-social-circles">
                        {githubUrl && (
                            <Magnetic strength={0.25}>
                                <a href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
                                    <FaGithub />
                                </a>
                            </Magnetic>
                        )}
                        {linkedinUrl && (
                            <Magnetic strength={0.25}>
                                <a href={linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                                    <FaLinkedinIn />
                                </a>
                            </Magnetic>
                        )}
                        {instagramUrl && (
                            <Magnetic strength={0.25}>
                                <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                                    <FaInstagram />
                                </a>
                            </Magnetic>
                        )}
                        {twitterUrl && (
                            <Magnetic strength={0.25}>
                                <a href={twitterUrl} target="_blank" rel="noreferrer" aria-label="Twitter/X">
                                    <FaTwitter />
                                </a>
                            </Magnetic>
                        )}
                        {whatsappUrl && (
                            <Magnetic strength={0.25}>
                                <a 
                                    href={whatsappUrl.startsWith('http') ? whatsappUrl : `https://wa.me/${whatsappUrl.replace(/[^0-9]/g, '')}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    aria-label="WhatsApp" 
                                    className="whatsapp-circle"
                                >
                                    <FaWhatsapp />
                                    <span className="online-badge-dot"></span>
                                </a>
                            </Magnetic>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;