import React, { useState, useEffect } from "react";
import "./FAQ.css";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";

const DEFAULT_FAQS = [
    {
        _id: "1",
        question: "What do you need from me to get started?",
        answer: "Just a clear idea of your project, goals, and any references you like. From there, I'll guide you through the process and handle everything needed to bring it to life."
    },
    {
        _id: "2",
        question: "How long does a project usually take?",
        answer: "It depends on the scope. A landing page typically takes 1–2 weeks, while a full product or web app can take 4–8 weeks. I'll give you a clear timeline before we begin."
    },
    {
        _id: "3",
        question: "Do you offer revisions?",
        answer: "Yes — every project includes revision rounds so we can fine-tune the design until it's exactly right. I believe in getting the details perfect."
    },
    {
        _id: "4",
        question: "Will my design be responsive?",
        answer: "Absolutely. Every project I deliver is fully responsive and tested across mobile, tablet, and desktop screen sizes — no exceptions."
    },
    {
        _id: "5",
        question: "Do you also handle development?",
        answer: "Yes. I work across both design and frontend development using React, Vite, and modern CSS. You get a designer and developer in one — saving you time and handoff friction."
    }
];

function FAQ() {
    const { faqs, isFaqsLoading } = useAdmin();
    
    const dbFaqs = faqs && faqs.length > 0 ? faqs : [];
    const showSkeleton = isFaqsLoading && dbFaqs.length === 0;
    
    const activeFaqs = dbFaqs.length > 0 
        ? dbFaqs 
        : (!isFaqsLoading ? DEFAULT_FAQS : []);

    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        if (activeFaqs.length > 0 && !openId) {
            setOpenId(activeFaqs[0]?._id || activeFaqs[0]?.id);
        }
    }, [activeFaqs, openId]);

    if (showSkeleton) {
        return (
            <section className="faq-section" id="faq">
                <div className="faq-container">
                    <div className="faq-header">
                        <h2 className="faq-title skeleton-text shimmer-placeholder" style={{ width: '380px', height: '32px', marginBottom: '16px' }}></h2>
                        <p className="faq-subtitle skeleton-text shimmer-placeholder" style={{ width: '280px', height: '18px' }}></p>
                    </div>
                    <div className="faq-list">
                        {[1, 2, 3, 4].map((n) => (
                            <div className="faq-item shimmer-placeholder" key={n} style={{ height: '64px', borderRadius: '12px', marginBottom: '12px' }}></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    const toggle = (id) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <section className="faq-section" id="faq">
            <div className="faq-container">

                <motion.div
                    className="faq-header"
                    initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h2 className="faq-title">
                        Frequently Asked <span>Questions</span>
                    </h2>
                    <p className="faq-subtitle">A few things you might be wondering about.</p>
                </motion.div>

                <motion.div
                    className="faq-list"
                    initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                >
                    {activeFaqs.map((faq, idx) => (
                        <motion.div
                            key={faq._id}
                            className={`faq-item ${openId === faq._id ? "open" : ""}`}
                            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
                        >
                            <button
                                className="faq-question"
                                onClick={() => toggle(faq._id)}
                                aria-expanded={openId === faq._id}
                            >
                                <span>{faq.question}</span>
                                <div className={`faq-icon ${openId === faq._id ? "rotated" : ""}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {openId === faq._id && (
                                    <motion.div
                                        className="faq-answer-wrap"
                                        key="answer"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        <p className="faq-answer">{faq.answer}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </section>
    );
}

export default FAQ;
