import React from "react";
import "./About.css";
import { motion } from "framer-motion";
import { FiDownload } from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext";

function About() {
    const { siteSettings, downloadCv } = useAdmin();
    const aboutSettings = siteSettings?.about || {};
    const navSettings = siteSettings?.navbar || {};

    return (
        <section className="about-section" id="about">
            <div className="about-container">
                <div className="about-left">
                    <motion.h2 
                        className="about-title"
                        initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        About Me<span>.</span>
                    </motion.h2>
                    <motion.p 
                        className="about-text"
                        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                    >
                        {aboutSettings.description || "I'm Faheem, a UI / UX Designer & Frontend Developer who enjoys turning complex ideas into simple, useful experiences. My design approach is rooted in empathy understanding people first and then creating solutions that truly help them. I've worked on projects that range from clean user interfaces to complete product journeys, always keeping usability at the heart of the process. For me, good design is not just about visuals, but about how smoothly someone can achieve what they need."}
                    </motion.p>
                </div>
                
                <div className="about-right">
                    <motion.div 
                        className="cta-box"
                        initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                    >
                        <h3>{aboutSettings.title || "Interested in working together?"}</h3>
                        <p>{aboutSettings.subtitle || "Download my resume to learn more about my experience and qualifications."}</p>
                        <a href="#download-cv" onClick={(e) => { e.preventDefault(); downloadCv(); }} className="download-cv-btn">
                            <FiDownload />
                            <span>{navSettings.downloadCvBtnText || "Download Resume"}</span>
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export default About;
