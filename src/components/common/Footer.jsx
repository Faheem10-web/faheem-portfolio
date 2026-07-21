import React from "react";
import "./Footer.css";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import {
    FaInstagram, FaYoutube, FaGithub, FaFacebook, FaDribbble
} from "react-icons/fa";
import Magnetic from "./Magnetic";

const MotionLink = motion(Link);

function Footer() {
    const { siteSettings } = useAdmin();
    const footerSettings = siteSettings?.footer || {};
    const contactSettings = siteSettings?.contact || {};
    
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const isHomePage = location.pathname === "/";

    return (
        <footer className="footer">

            {/* ── CTA HERO AREA ── */}
            <div className="footer-cta-area">

                {/* Background video */}
                <video
                    className="footer-bg-video"
                    src={footerSettings.bgVideo || "/assets/footer-bg.mp4"}
                    autoPlay
                    muted
                    loop
                    playsInline
                />
                {/* Dark overlay for readability */}
                <div className="footer-video-overlay" aria-hidden="true" />

                {/* Glow orb */}
                <div className="footer-orb" aria-hidden="true"></div>

                {/* CTA text */}
                <div className="footer-cta-content">
                    <motion.h2
                        className="footer-cta-heading"
                        initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Have an idea?
                    </motion.h2>

                    <MotionLink
                        to="/contact"
                        className="footer-cta-btn"
                        initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        TELL US
                    </MotionLink>
                </div>
            </div>

            {/* ── INFO GRID ── */}
            <div className="footer-info-grid">

                {/* Left: contact details */}
                <div className="footer-contact-col">
                    <a href={`mailto:${contactSettings.email || "hello@faheem.design"}`} className="footer-pill-btn">
                        {contactSettings.email || "hello@faheem.design"}
                    </a>
                    {contactSettings.phone && (
                        <a href={`tel:${contactSettings.phone}`} className="footer-pill-btn">
                            {contactSettings.phone}
                        </a>
                    )}

                    <div className="footer-addresses">
                        <div className="footer-address">
                            <span className="address-label">LOCATION</span>
                            <span className="address-text">{contactSettings.address || "Bangalore, India"}</span>
                        </div>
                        <div className="footer-address">
                            <span className="address-label">REMOTE</span>
                            <span className="address-text">Available Worldwide<br />Full Remote</span>
                        </div>
                    </div>
                </div>

                {/* Spacer */}
                <div className="footer-spacer" />

                {/* Right: nav columns */}
                <div className="footer-nav-cols">
                    <div className="footer-nav-col">
                        <Link to="/projects">Projects</Link>
                        <a href={isHomePage ? "#about"   : "/#about"}>Services</a>
                        <a href={isHomePage ? "#about"   : "/#about"}>Company</a>
                    </div>
                    <div className="footer-nav-col">
                        <a href={isHomePage ? "#faq"     : "/#faq"}>FAQ</a>
                        <a href={isHomePage ? "#about"   : "/#about"}>Workflow</a>
                        <Link to="/contact">Contact</Link>
                    </div>
                </div>

            </div>

            {/* ── BOTTOM BAR ── */}
            <div className="footer-bottom">
                <div className="footer-bottom-left">
                    <a href="#" className="footer-policy">Privacy Policy</a>
                    <span className="footer-copy">{footerSettings.copyrightText || `${currentYear}, FAHEEM`}</span>
                </div>

                <div className="footer-socials">
                    <Magnetic strength={0.3}><a href="https://instagram.com"  target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a></Magnetic>
                    <Magnetic strength={0.3}><a href="https://youtube.com"    target="_blank" rel="noreferrer" aria-label="YouTube"><FaYoutube /></a></Magnetic>
                    <Magnetic strength={0.3}><a href="https://github.com"     target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub /></a></Magnetic>
                    <Magnetic strength={0.3}><a href="https://facebook.com"   target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebook /></a></Magnetic>
                    <Magnetic strength={0.3}><a href="https://dribbble.com"   target="_blank" rel="noreferrer" aria-label="Dribbble"><FaDribbble /></a></Magnetic>
                </div>
            </div>

        </footer>
    );
}

export default Footer;