import React, { memo } from "react";
import "./Footer.css";
import { Link, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import {
    FiHome,
    FiUser,
    FiBriefcase,
    FiMail,
    FiArrowUp
} from "react-icons/fi";
import {
    FaLinkedinIn,
    FaInstagram,
    FaWhatsapp,
    FaGithub,
    FaTwitter
} from "react-icons/fa";
import Magnetic from "./Magnetic";

const Footer = memo(function Footer() {
    const { siteSettings } = useAdmin();
    const footerSettings = siteSettings?.footer || {};
    const contactSettings = siteSettings?.contact || {};
    
    const location = useLocation();

    const bgImage = footerSettings.bgImage || "/assets/footer_sky_bg.png";
    const bgVideo = footerSettings.bgVideo || "";
    const bgMediaType = footerSettings.bgMediaType || (bgVideo ? "video" : "image");

    const githubUrl = footerSettings.githubUrl || contactSettings.githubUrl || "https://github.com";
    const linkedinUrl = footerSettings.linkedinUrl || contactSettings.linkedinUrl || "https://linkedin.com";
    const instagramUrl = footerSettings.instagramUrl || contactSettings.instagramUrl || "https://instagram.com";
    const whatsappUrl = footerSettings.whatsappUrl || contactSettings.whatsappUrl || "https://wa.me/917356164236";
    const twitterUrl = footerSettings.twitterUrl || contactSettings.twitterUrl || "";

    const emailColorMode = footerSettings.emailTextColor || 'dark';
    const emailTextColor = emailColorMode === 'white' ? '#ffffff' : '#0d0d12';

    const bgBlur = footerSettings.bgBlur !== undefined ? Number(footerSettings.bgBlur) : 12;
    const bgBrightness = footerSettings.bgBrightness !== undefined ? Number(footerSettings.bgBrightness) : 100;

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
                {/* Background Image / Video Layer contained ONLY inside Card */}
                <div className="footer-card-bg" aria-hidden="true">
                    {bgMediaType === 'video' && bgVideo ? (
                        <video
                            src={bgVideo}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="footer-card-bg-img"
                            style={{
                                filter: `blur(${bgBlur}px) brightness(${bgBrightness}%)`,
                                objectFit: 'cover',
                                width: '100%',
                                height: '100%'
                            }}
                        />
                    ) : (
                        <img 
                            src={bgImage} 
                            alt="" 
                            className="footer-card-bg-img"
                            loading="lazy"
                            decoding="async"
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
                    )}
                </div>

                {/* Ambient Lavender & Pink Glow Orbs */}
                <div className="footer-glow-orb orb-left" aria-hidden="true" />
                <div className="footer-glow-orb orb-right" aria-hidden="true" />

                {/* ── CARD TOP SECTION ── */}
                <div className="footer-card-top">
                    {/* Giant Center Name Display */}
                    <div className="footer-email-container">
                        <h2 className="footer-email-link" style={{ color: emailTextColor, cursor: 'default' }}>
                            Faheem A V
                        </h2>
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

                {/* ── CARD BOTTOM SUB-FOOTER ROW ── */}
                <div className="footer-card-bottom">
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
});

export default Footer;