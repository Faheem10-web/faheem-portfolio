import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Sparkles, RotateCcw, ExternalLink } from "lucide-react";
import { getAIResponse } from "../../utils/aiChatService";
import { API_BASE } from "../../config/api";
import "./AIChatbot.css";

const INITIAL_WELCOME_MESSAGE = {
  id: "welcome-1",
  sender: "assistant",
  text: "Ask me about my work, skills, projects, experience, or availability.",
  timestamp: "Just now",
  actions: [],
};

const DEFAULT_SUGGESTED_CHIPS = [
  "Explore Projects",
  "My Skills",
  "My Experience",
  "Recruiter Mode",
];

const DEFAULT_AVATAR_FALLBACK = "https://res.cloudinary.com/ddluoarzr/image/upload/v1785645438/fhm._xtraoh.png";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);
  const [suggestedChips, setSuggestedChips] = useState(DEFAULT_SUGGESTED_CHIPS);

  const [profileAvatarUrl, setProfileAvatarUrl] = useState(DEFAULT_AVATAR_FALLBACK);
  const [avatarError, setAvatarError] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Fetch live About/Profile photo from MongoDB /api/settings
  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((res) => res.json())
      .then((data) => {
        const liveImg = data?.settings?.about?.aboutPage?.aboutImage || data?.settings?.about?.home?.aboutImage || data?.settings?.about?.aboutImage;
        if (liveImg && typeof liveImg === "string" && liveImg.trim()) {
          setProfileAvatarUrl(liveImg.trim());
          setAvatarError(false);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  // Precise Body Scroll Lock and Mouse Wheel Forwarding to Chatbot Messages
  useEffect(() => {
    if (!isOpen) return;

    // Save exact scroll position
    const savedScrollY = window.scrollY || window.pageYOffset || 0;

    // Apply strict body lock without scrollbar jump
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = "100%";

    // Non-passive wheel handler: mouse wheel over chatbot panel ALWAYS scrolls messages area
    const handleWheel = (e) => {
      const chatPanelEl = chatWindowRef.current;
      const chatBodyEl = messagesEndRef.current?.closest('.ai-chat-body');

      if (chatPanelEl && chatPanelEl.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();

        if (chatBodyEl) {
          chatBodyEl.scrollTop += e.deltaY;
        }
      } else {
        // Mouse cursor is outside chatbot -> block background scrolling completely
        e.preventDefault();
      }
    };

    // Non-passive touchmove handler for mobile touch scrolling
    const handleTouchMove = (e) => {
      const chatPanelEl = chatWindowRef.current;
      if (chatPanelEl && chatPanelEl.contains(e.target)) {
        e.stopPropagation();
      } else {
        // Touch outside chatbot: BLOCK BACKGROUND TOUCH SCROLL
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      // Restore background position & styles
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;

      window.scrollTo(0, savedScrollY);

      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle sending a user message
  const handleSendMessage = async (textToSend) => {
    const messageContent = typeof textToSend === "string" ? textToSend : inputText;
    const cleanContent = messageContent.trim();
    if (!cleanContent || isTyping) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: cleanContent,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await getAIResponse(cleanContent);
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: response.text,
        actions: response.actions || [],
        timestamp: response.timestamp || "Just now",
      };

      if (Array.isArray(response.suggestedQuestions) && response.suggestedQuestions.length > 0) {
        setSuggestedChips(response.suggestedQuestions);
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg = {
        id: `assistant-err-${Date.now()}`,
        sender: "assistant",
        text: error?.message || "Faheem's AI assistant is temporarily unavailable. Please try again in a moment!",
        actions: [],
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleChipClick = (chipText) => {
    handleSendMessage(chipText);
  };

  const handleResetChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setSuggestedChips(DEFAULT_SUGGESTED_CHIPS);
    setIsTyping(false);
    setInputText("");
  };

  return (
    <div className="ai-chatbot-root">
      {/* Floating Trigger Button */}
      <button
        ref={fabRef}
        className={`ai-chatbot-fab ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        <div className="ai-fab-glow"></div>
        <div className="ai-fab-content">
          {isOpen ? (
            <X className="ai-fab-close-icon" />
          ) : (
            <>
              <div className="ai-fab-icon-wrapper">
                <Sparkles className="ai-fab-sparkle-icon" />
              </div>
              <span className="ai-fab-online-badge"></span>
            </>
          )}
        </div>
      </button>

      {/* Chat Panel Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            className="ai-chatbot-panel"
            role="dialog"
            aria-modal="true"
            aria-label="AI Assistant"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 10,
              transition: { duration: 0.18, ease: "easeOut" },
            }}
          >
            {/* Minimal Header without Text */}
            <div className="ai-chat-header">
              <div className="ai-chat-header-left">
                <div className="ai-header-icon-badge">
                  <Sparkles size={14} className="ai-header-sparkle-icon" />
                </div>
              </div>

              <div className="ai-header-actions">
                <span className="ai-status-badge">
                  <span className="ai-status-dot"></span>
                  <span className="ai-status-text">Online</span>
                </span>
                <button
                  type="button"
                  className="ai-header-btn"
                  onClick={handleResetChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  className="ai-header-btn ai-close-btn"
                  onClick={() => {
                    setIsOpen(false);
                    fabRef.current?.focus();
                  }}
                  aria-label="Close Chat Window"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Chat Body Area */}
            <div className="ai-chat-body">
              {/* Centered Profile Avatar Welcome Banner */}
              <div className="ai-welcome-banner">
                <div className="ai-profile-avatar-wrapper">
                  {!avatarError && profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt="Faheem A V"
                      className="ai-profile-avatar-img"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="ai-avatar-fallback">
                      <Sparkles size={24} className="ai-avatar-fallback-icon" />
                    </div>
                  )}
                </div>
                <h4 className="ai-welcome-title">Hi, I'm Faheem's AI Assistant.</h4>
                <p className="ai-welcome-subtitle">Ask me about my work, skills, projects, experience, or availability.</p>
              </div>

              {/* Messages Stream */}
              <div className="ai-messages-list">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`ai-message-row ${
                      msg.sender === "user" ? "user-row" : "assistant-row"
                    }`}
                  >
                    <div className="ai-msg-bubble-wrapper">
                      <div className={`ai-msg-bubble ${msg.sender}-bubble`}>
                        <p className="ai-msg-text">{msg.text}</p>
                        
                        {/* Contextual Action Buttons */}
                        {Array.isArray(msg.actions) && msg.actions.length > 0 && (
                          <div className="ai-msg-actions">
                            {msg.actions.map((act, actionIdx) => (
                              <a
                                key={actionIdx}
                                href={act.url}
                                target={act.url.startsWith("http") || act.url.startsWith("mailto") ? "_blank" : "_self"}
                                rel="noopener noreferrer"
                                className="ai-action-btn"
                              >
                                <span>{act.label}</span>
                                <ExternalLink size={11} className="ai-action-icon" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="ai-msg-timestamp">{msg.timestamp}</span>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator State */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ai-message-row assistant-row"
                  >
                    <div className="ai-msg-bubble-wrapper">
                      <div className="ai-msg-bubble assistant-bubble ai-typing-bubble">
                        <div className="ai-typing-dots">
                          <span className="ai-dot"></span>
                          <span className="ai-dot"></span>
                          <span className="ai-dot"></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Dynamic Suggested Question Chips */}
              <div className="ai-suggested-section">
                <div className="ai-chips-grid">
                  {suggestedChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="ai-chip-btn"
                      onClick={() => handleChipClick(chip)}
                      disabled={isTyping}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Bottom Input Form */}
            <form className="ai-chat-footer" onSubmit={handleSubmit}>
              <div className="ai-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="ai-chat-input"
                  placeholder="Ask anything about Faheem..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isTyping}
                  aria-label="Ask Faheem's AI Assistant"
                />
                <button
                  type="submit"
                  className={`ai-send-btn ${inputText.trim() ? "is-active" : ""}`}
                  disabled={!inputText.trim() || isTyping}
                  aria-label="Send Message"
                >
                  <Send className="ai-send-icon" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
