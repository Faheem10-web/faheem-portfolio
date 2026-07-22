import React, { useState, useEffect, useRef } from "react";
import "./ChatWidget.css";
import { AnimatePresence, motion } from "framer-motion";
import { useAdmin } from "../../context/AdminContext";
import { FiX, FiSend, FiArrowRight } from "react-icons/fi";

const QUICK_ACTIONS = [
  { label: "🎨 UI/UX Design", message: "Hello Faheem, I'm interested in UI/UX design services." },
  { label: "💻 Frontend Development", message: "Hello Faheem, I need frontend development for my project." },
  { label: "🚀 Build My Website", message: "Hello Faheem, I'd like you to build my website." },
  { label: "📁 View Portfolio", message: "Hello Faheem, I'm interested in viewing more of your portfolio projects." },
  { label: "💬 Get a Quote", message: "Hello Faheem, Can I get a quotation for my project?" },
  { label: "📅 Book a Call", message: "Hello Faheem, I'd like to schedule a call." }
];

// Custom Chat Bubble Icon SVG matching premium SaaS look
const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "translateY(1px)" }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function ChatWidget() {
  const { siteSettings } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  
  const triggerRef = useRef(null);
  const chatWindowRef = useRef(null);

  const contactSettings = siteSettings?.contact || {};
  const aboutSettings = siteSettings?.about || {};
  const heroSettings = siteSettings?.hero || {};

  const profileName = heroSettings.name ? `${heroSettings.name} A V` : "Faheem A V";
  const profileImage = aboutSettings.aboutImage || "/assets/about_profile.png";

  const getCleanPhone = () => {
    const rawNum = contactSettings.whatsapp || "+91 7356164236";
    return rawNum.replace(/[^0-9]/g, '');
  };

  const handleQuickActionClick = (msgText) => {
    const cleanNum = getCleanPhone();
    const message = encodeURIComponent(msgText);
    window.open(`https://wa.me/${cleanNum}?text=${message}`, "_blank");
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customMessage.trim()) return;
    const cleanNum = getCleanPhone();
    const message = encodeURIComponent(customMessage.trim());
    window.open(`https://wa.me/${cleanNum}?text=${message}`, "_blank");
    setCustomMessage("");
  };

  // Keyboard accessibility & focus trapping
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape closes chat
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }

      // Tab key focus trap
      if (e.key === "Tab" && isOpen && chatWindowRef.current) {
        const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(
          chatWindowRef.current.querySelectorAll(focusableElementsString)
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // If Shift + Tab and on first element, wrap to last
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // If Tab and on last element, wrap to first
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Autofocus the close button or first element when chat opens
  useEffect(() => {
    if (isOpen && chatWindowRef.current) {
      const closeBtn = chatWindowRef.current.querySelector(".chat-close-btn");
      closeBtn?.focus();
    }
  }, [isOpen]);

  const chatVariants = {
    closed: { 
      opacity: 0, 
      scale: 0.85, 
      y: 40,
      filter: "blur(10px)",
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    open: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 26,
        mass: 0.8
      }
    }
  };

  return (
    <div className="portfolio-chat-container">
      {/* Floating Action Trigger Button */}
      <button
        ref={triggerRef}
        className={`portfolio-chat-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close portfolio chat" : "Open portfolio chat"}
        aria-expanded={isOpen}
        title="Chat with Faheem"
      >
        {isOpen ? <FiX size={24} /> : <ChatIcon />}
      </button>

      {/* Glassmorphic Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            className="portfolio-chat-window"
            variants={chatVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="dialog"
            aria-modal="true"
            aria-label={`Chat with ${profileName}`}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-profile">
                <div className="chat-avatar-wrapper">
                  <img 
                    src={profileImage} 
                    alt={profileName} 
                    className="chat-avatar"
                  />
                  <span className="chat-status-dot"></span>
                </div>
                <div className="chat-profile-meta">
                  <span className="chat-profile-name">{profileName}</span>
                  <span className="chat-profile-status">
                    Online • Replies within a few hours
                  </span>
                </div>
              </div>
              <button 
                className="chat-close-btn"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close chat window"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="chat-body">
              {/* Welcome Message Card */}
              <div className="chat-welcome-card">
                <span className="chat-welcome-title">Hi there! 👋</span>
                <p className="chat-welcome-desc">
                  <span>I'm Faheem, a UI/UX Designer & Frontend Developer.</span>
                  <span>I create modern websites, intuitive user experiences, and high-performance frontend applications.</span>
                  <span>How can I help with your project today?</span>
                </p>
              </div>

              {/* Quick Action Selector Grid */}
              <span className="chat-actions-label">Select a service:</span>
              <div className="chat-quick-actions">
                {QUICK_ACTIONS.map((action, index) => (
                  <button
                    key={index}
                    className="chat-action-btn"
                    onClick={() => handleQuickActionClick(action.message)}
                  >
                    <span className="chat-action-btn-text">{action.label}</span>
                    <span className="chat-action-arrow"><FiArrowRight size={14} /></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Form Custom Input */}
            <form onSubmit={handleCustomSubmit} className="chat-footer">
              <div className="chat-input-wrapper">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type your message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  aria-label="Type message to send via WhatsApp"
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!customMessage.trim()}
                  aria-label="Send custom message"
                >
                  <FiSend />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatWidget;
