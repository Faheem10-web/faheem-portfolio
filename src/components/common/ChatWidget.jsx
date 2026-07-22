import React, { useState, useEffect, useRef } from "react";
import "./ChatWidget.css";
import { AnimatePresence, motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { FiX, FiSend } from "react-icons/fi";
import { useAdmin } from "../../context/AdminContext";

function ChatWidget() {
    const { siteSettings } = useAdmin();
    const [isOpen, setIsOpen] = useState(false);
    const [messageText, setMessageText] = useState("");
    const chatWindowRef = useRef(null);
    const fabRef = useRef(null);

    const contactSettings = siteSettings?.contact || {};
    const aboutSettings = siteSettings?.about || {};
    const rawNum = contactSettings.whatsapp || "+91 7356164236";
    const cleanNum = rawNum.replace(/[^0-9]/g, "");

    const avatarImg = aboutSettings.aboutImage || "/assets/about_profile.png";
    const portfolioName = siteSettings?.hero?.name || "Faheem";

    // Close on Escape Key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                fabRef.current?.focus();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    // Accessibility Focus Trap
    useEffect(() => {
        if (!isOpen) return;

        const focusableElementsSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const modal = chatWindowRef.current;
        if (!modal) return;

        const focusableContent = modal.querySelectorAll(focusableElementsSelector);
        if (focusableContent.length > 0) {
            // Focus input or first focusable item
            const inputField = modal.querySelector(".chat-input");
            if (inputField) {
                inputField.focus();
            } else {
                focusableContent[0].focus();
            }
        }

        const handleTabKey = (e) => {
            if (e.key !== "Tab") return;

            const elements = modal.querySelectorAll(focusableElementsSelector);
            if (elements.length === 0) return;

            const firstElement = elements[0];
            const lastElement = elements[elements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        window.addEventListener("keydown", handleTabKey);
        return () => {
            window.removeEventListener("keydown", handleTabKey);
        };
    }, [isOpen]);

    // Handlers
    const handleQuickAction = (topic) => {
        let msg = "";
        switch (topic) {
            case "uiux":
                msg = `Hi ${portfolioName}, I'd like to discuss a Custom Web / UI Design project.`;
                break;
            case "hire":
                msg = `Hi ${portfolioName}, I'd like to hire you for a project.`;
                break;
            case "pricing":
                msg = `Hi ${portfolioName}, I'd like to ask about pricing and quotations.`;
                break;
            default:
                msg = `Hi ${portfolioName}, I'd like to discuss a project.`;
        }
        window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(messageText.trim())}`, "_blank", "noopener,noreferrer");
        setMessageText("");
    };

    return (
        <div className="chat-widget-container">
            {/* FAB Toggle Button */}
            <button
                ref={fabRef}
                className="chat-widget-fab"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label="Open WhatsApp Chat Support"
            >
                <FaWhatsapp />
                <span className="chat-widget-badge"></span>
                {!isOpen && (
                    <span className="chat-widget-tooltip">
                        Chat with {portfolioName}
                    </span>
                )}
            </button>

            {/* Chat Window with Spring Animations */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={chatWindowRef}
                        className="chat-window"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="chat-user-name"
                        initial={{ opacity: 0, scale: 0.85, y: 30 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            transition: { type: "spring", stiffness: 350, damping: 25 }
                        }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.85, 
                            y: 30,
                            transition: { duration: 0.2, ease: "easeInOut" }
                        }}
                    >
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar-container">
                                    <img src={avatarImg} alt={`${portfolioName} Profile`} className="chat-avatar" />
                                </div>
                                <div className="chat-user-details">
                                    <span id="chat-user-name" className="chat-user-name">{portfolioName}</span>
                                    <span className="chat-status">
                                        Online • Replies in minutes
                                    </span>
                                </div>
                            </div>
                            <button
                                className="chat-close-btn"
                                onClick={() => {
                                    setIsOpen(false);
                                    fabRef.current?.focus();
                                }}
                                aria-label="Close Chat Window"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="chat-body">
                            <div className="chat-date-divider">Today</div>

                            <div className="welcome-bubble">
                                <p>Hi there! 👋 I'm {portfolioName}, UI/UX Designer & Front-End Developer.</p>
                                <p style={{ marginTop: "12px" }}>How can I help you with your web or mobile project today?</p>
                                <span className="bubble-timestamp">Just now</span>
                            </div>

                            <div className="quick-actions-container">
                                <button className="quick-action-btn" onClick={() => handleQuickAction("uiux")}>
                                    💬 Custom Web / UI Design
                                </button>
                                <button className="quick-action-btn" onClick={() => handleQuickAction("hire")}>
                                    🚀 Hire for a Project
                                </button>
                                <button className="quick-action-btn" onClick={() => handleQuickAction("pricing")}>
                                    💰 Pricing & Quotation
                                </button>
                            </div>
                        </div>

                        {/* Footer / Input form */}
                        <form className="chat-footer" onSubmit={handleSendMessage}>
                            <div className="chat-input-wrapper">
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder={`Type a message to ${portfolioName}...`}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    aria-label="Type message to send via WhatsApp"
                                />
                            </div>
                            <button
                                type="submit"
                                className="chat-send-btn"
                                aria-label="Send message via WhatsApp"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ChatWidget;
