import React from "react";
import "./Footer.css";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import {
    FaGithub, FaLinkedinIn, FaTwitter, FaDribbble, FaArrowRight
} from "react-icons/fa";
import Magnetic from "./Magnetic";

function Footer() {
    const { siteSettings } = useAdmin();
    const footerSettings = siteSettings?.footer || {};
    const contactSettings = siteSettings?.contact || {};
    const globalSettings = siteSettings?.global || {};
    const heroSettings = siteSettings?.hero || {};

    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const isHomePage = location.pathname === "/";

    // Brand name for giant bottom text
    const brandName = footerSettings.giantText || globalSettings.siteName || heroSettings.name || "COLLINS JOHNSON";

    return (
        <footer className="footer-section">
            <div className="footer-wrapper">
                
                {/* ── FLOATING GLASSMORTIC CARD ── */}
                <motion.div 
                    className="footer-card"
                    initial={{ opacity: 0, y: 35 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Upper Area: Bio & Navigation Columns */}
                    <div className="footer-card-top">
                        {/* Brand Description & CTA */}
                        <div className="footer-brand-col">
                            <p className="footer-description">
                                {footerSettings.description || 
                                 "I design and build visually striking, high-performing digital experiences that help brands stand out and convert."}
                            </p>

                            <Link to="/contact" className="footer-contact-pill">
                                <span>Contact Me</span>
                                <FaArrowRight className="footer-pill-arrow" />
                            </Link>
                        </div>

                        {/* Navigation Columns */}
                        <div className="footer-links-grid">
                            <div className="footer-link-group">
                                <h4 className="footer-group-title">Site Map</h4>
                                <Link to="/">Home</Link>
                                <a href={isHomePage ? "#services" : "/#services"}>Services</a>
                                <Link to="/projects">Projects</Link>
                                <a href={isHomePage ? "#about" : "/#about"}>Pricing</a>
                            </div>

                            <div className="footer-link-group">
                                <h4 className="footer-group-title">Personal</h4>
                                <a href={isHomePage ? "#experience" : "/#experience"}>Process</a>
                                <a href={isHomePage ? "#about" : "/#about"}>About</a>
                            </div>

                            <div className="footer-link-group">
                                <h4 className="footer-group-title">Information</h4>
                                <a href={isHomePage ? "#about" : "/#about"}>Why Me</a>
                                <a href={isHomePage ? "#faq" : "/#faq"}>FAQ</a>
                            </div>
                        </div>
                    </div>

                    {/* Lower Area: Social Buttons & Copyright */}
                    <div className="footer-card-bottom">
                        <div className="footer-social-circles">
                            <Magnetic strength={0.2}>
                                <a 
                                    href={contactSettings.github || "https://github.com"} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    aria-label="GitHub"
                                >
                                    <FaGithub />
                                </a>
                            </Magnetic>
                            <Magnetic strength={0.2}>
                                <a 
                                    href={contactSettings.linkedin || "https://linkedin.com"} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    aria-label="LinkedIn"
                                >
                                    <FaLinkedinIn />
                                </a>
                            </Magnetic>
                            <Magnetic strength={0.2}>
                                <a 
                                    href={contactSettings.twitter || "https://twitter.com"} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    aria-label="Twitter"
                                >
                                    <FaTwitter />
                                </a>
                            </Magnetic>
                            <Magnetic strength={0.2}>
                                <a 
                                    href={contactSettings.dribbble || "https://dribbble.com"} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    aria-label="Dribbble"
                                >
                                    <FaDribbble />
                                </a>
                            </Magnetic>
                        </div>

                        <div className="footer-copyright-text">
                            {footerSettings.copyrightText || `© ${currentYear} — Copyright. All Rights reserved`}
                        </div>
                    </div>
                </motion.div>

                {/* ── GIANT BACKGROUND TYPOGRAPHY ── */}
                <motion.div 
                    className="footer-giant-title"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    {brandName}
                </motion.div>

            </div>
        </footer>
    );
}

export default Footer;