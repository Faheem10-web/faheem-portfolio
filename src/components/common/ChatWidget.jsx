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
    const chatSettings = siteSettings?.chat || {};

    const rawNum = contactSettings.whatsapp || "+91 7356164236";
    const cleanNum = rawNum.replace(/[^0-9]/g, "");

    const avatarImg = aboutSettings.aboutImage || "/assets/about_profile.png";
    const portfolioName = siteSettings?.hero?.name || "Faheem";

    // Dynamic customization defaults
    const buttonText = chatSettings.buttonText || "Quick Chat";
    const headerTitle = chatSettings.headerTitle || portfolioName;
    const headerStatusText = chatSettings.headerStatusText || "Online • Replies in minutes";
    const welcomeLine1 = chatSettings.welcomeMessageLine1 || `Hi there! 👋 I'm ${portfolioName}, UI/UX Designer & Front-End Developer.`;
    const welcomeLine2 = chatSettings.welcomeMessageLine2 || "How can I help you with your web or mobile project today?";

    const quick1Text = chatSettings.quickAction1Text || "💬 Custom Web / UI Design";
    const quick1Msg = chatSettings.quickAction1Message || `Hi ${portfolioName}, I'd like to discuss a Custom Web / UI Design project.`;
    
    const quick2Text = chatSettings.quickAction2Text || "🚀 Hire for a Project";
    const quick2Msg = chatSettings.quickAction2Message || `Hi ${portfolioName}, I'd like to hire you for a project.`;
    
    const quick3Text = chatSettings.quickAction3Text || "💰 Pricing & Quotation";
    const quick3Msg = chatSettings.quickAction3Message || `Hi ${portfolioName}, I'd like to ask about pricing and quotations.`;

    // Dynamic style bindings
    const customStyles = {
        '--chat-font-family': chatSettings.fontFamily || 'var(--font-heading)',
        '--chat-header-bg': chatSettings.headerBgColor || '#0F8C6E',
        '--chat-header-text': chatSettings.headerTextColor || '#ffffff',
        '--chat-btn-bg': chatSettings.buttonBgColor || '#0d0d11',
        '--chat-btn-text': chatSettings.buttonTextColor || '#ffffff',
        '--chat-btn-border': chatSettings.buttonBorderColor || 'rgba(255, 255, 255, 0.14)',
        '--chat-btn-icon': chatSettings.buttonIconColor || '#25D366',
        '--chat-btn-dot': chatSettings.buttonDotColor || '#10B981',
        '--chat-window-bg': chatSettings.chatBgColor || '#0b0b0f',
        '--chat-bubble-bg': chatSettings.welcomeBubbleBg || '#1E1F26'
    };

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
    const handleQuickAction = (customMsg) => {
        window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(customMsg)}`, "_blank", "noopener,noreferrer");
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(messageText.trim())}`, "_blank", "noopener,noreferrer");
        setMessageText("");
    };

    // Do not render if explicitly disabled in admin settings
    if (chatSettings.enabled === false) return null;

    return (
        <div className="chat-widget-container" style={customStyles}>
            {/* FAB / Circular WhatsApp Trigger Button */}
            <button
                ref={fabRef}
                className="chat-widget-fab"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label="Open WhatsApp Chat Support"
            >
                <div className="chat-fab-content">
                    {isOpen ? (
                        <FiX className="chat-fab-close-icon" />
                    ) : (
                        <>
                            <FaWhatsapp className="chat-fab-wa-icon" />
                            <span className="chat-fab-online-dot"></span>
                        </>
                    )}
                </div>
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
                                    <img src={avatarImg} alt={`${headerTitle} Profile`} className="chat-avatar" />
                                </div>
                                <div className="chat-user-details">
                                    <span id="chat-user-name" className="chat-user-name">{headerTitle}</span>
                                    <span className="chat-status">
                                        {headerStatusText}
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
                                <p>{welcomeLine1}</p>
                                <p style={{ marginTop: "12px" }}>{welcomeLine2}</p>
                                <span className="bubble-timestamp">Just now</span>
                            </div>

                            <div className="quick-actions-container">
                                <button className="quick-action-btn" onClick={() => handleQuickAction(quick1Msg)}>
                                    {quick1Text}
                                </button>
                                <button className="quick-action-btn" onClick={() => handleQuickAction(quick2Msg)}>
                                    {quick2Text}
                                </button>
                                <button className="quick-action-btn" onClick={() => handleQuickAction(quick3Msg)}>
                                    {quick3Text}
                                </button>
                            </div>
                        </div>

                        {/* Footer / Input form */}
                        <form className="chat-footer" onSubmit={handleSendMessage}>
                            <div className="chat-input-wrapper">
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder={`Type a message to ${headerTitle}...`}
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
