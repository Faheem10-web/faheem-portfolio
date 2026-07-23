import React, { useState, useEffect, useRef } from "react";
import "./FAQ.css";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";

const DEFAULT_FAQS = [
    {
        _id: "1",
        question: "What services do you offer?",
        answer: "There are many types of services we offer, ranging from design and development to marketing and consulting, but each project is tailored individually, ensuring a unique solution that fits your needs perfectly."
    },
    {
        _id: "2",
        question: "How long does a project take?",
        answer: "Typical design and development projects range from 2 to 6 weeks, depending on complexity. We will outline a clear step-by-step timeline and milestones before getting started."
    },
    {
        _id: "3",
        question: "What is your pricing model?",
        answer: "We offer both fixed-price projects and monthly retainers. Every quote is custom-tailored to the specific scope, details, and goals of your project."
    },
    {
        _id: "4",
        question: "Do you offer post-project support?",
        answer: "Yes, we provide ongoing maintenance, support packages, and optimization options to keep your site or app running smoothly long after launch."
    }
];

function FAQ() {
    const { faqs, isFaqsLoading, siteSettings } = useAdmin();
    
    const faqSettings = siteSettings?.faq || {};
    const bgImage = faqSettings.bgImage || "/assets/faq_bg_blocks.png";
    const sectionTitle = faqSettings.title || "Frequently asked Questions";

    const dbFaqs = faqs && faqs.length > 0 ? faqs : [];
    const showSkeleton = isFaqsLoading && dbFaqs.length === 0;
    
    const activeFaqs = dbFaqs.length > 0 
        ? dbFaqs 
        : (!isFaqsLoading ? DEFAULT_FAQS : []);

    const [openId, setOpenId] = useState(null);
    const timerRef = useRef(null);

    const toggle = (id) => {
        setOpenId((prevId) => (prevId === id ? null : id));
    };

    // Auto-close FAQ tab after 4 seconds (4000ms)
    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (openId !== null) {
            timerRef.current = setTimeout(() => {
                setOpenId(null);
            }, 4000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [openId]);

    if (showSkeleton) {
        return (
            <section className="faq-section" id="faq">
                <div className="faq-container">
                    <div className="faq-header">
                        <div className="skeleton-text shimmer-placeholder" style={{ width: '380px', height: '36px', margin: '0 auto 16px auto' }}></div>
                    </div>
                    <div className="faq-list">
                        {[1, 2, 3, 4].map((n) => (
                            <div className="faq-item shimmer-placeholder" key={n} style={{ height: '76px', borderRadius: '40px', marginBottom: '16px' }}></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="faq-section" id="faq">
            {/* 3D Geometric Abstract Blocks Background Layer */}
            <div className="faq-section-bg" aria-hidden="true">
                <img 
                    src={bgImage} 
                    alt="" 
                    className="faq-section-bg-img"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        if (!e.target.src.includes('/assets/faq_bg_blocks.png')) {
                            e.target.src = '/assets/faq_bg_blocks.png';
                        }
                    }}
                />
                <div className="faq-section-bg-overlay"></div>
            </div>

            <div className="faq-container">

                <motion.div
                    className="faq-header"
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h2 className="faq-title">
                        {sectionTitle}
                    </h2>
                </motion.div>

                <motion.div
                    className="faq-list"
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                >
                    {activeFaqs.map((faq, idx) => {
                        const isOpen = openId === faq._id;
                        return (
                            <motion.div
                                key={faq._id}
                                className={`faq-item ${isOpen ? "open" : ""}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
                            >
                                <button
                                    className="faq-question"
                                    onClick={() => toggle(faq._id)}
                                    aria-expanded={isOpen}
                                >
                                    <span>{faq.question}</span>
                                    <div className="faq-icon-wrapper">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            {/* Horizontal line (always visible) */}
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            {/* Vertical line (collapses when open) */}
                                            <motion.line 
                                                x1="12" y1="5" x2="12" y2="19"
                                                animate={{ scaleY: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                style={{ originY: "50%" }}
                                            />
                                        </svg>
                                    </div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            className="faq-answer-wrap"
                                            key="answer"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                                        >
                                            <div className="faq-answer-inner">
                                                <p className="faq-answer">{faq.answer}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>

            </div>
        </section>
    );
}

export default FAQ;
