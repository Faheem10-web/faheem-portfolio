import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Sparkles, RotateCcw, ExternalLink } from "lucide-react";
import { getAIResponse } from "../../utils/aiChatService";
import { API_BASE } from "../../config/api";
import AIAssistantAvatar from "../chatbot/AIAssistantAvatar";
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

  // Hero section scroll state & responsiveness
  const [isHeroSection, setIsHeroSection] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Viewport resize tracking
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Smooth scroll progress & Hero section detection
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const heroEl = document.getElementById("home") || document.querySelector(".hero");
          const currentScroll = window.scrollY || window.pageYOffset || 0;

          if (heroEl) {
            const heroRect = heroEl.getBoundingClientRect();
            const heroHeight = heroEl.offsetHeight || 700;

            if (heroRect.bottom > 100 && currentScroll < heroHeight) {
              setIsHeroSection(true);
              const progress = Math.min(1, Math.max(0, currentScroll / (heroHeight * 0.75)));
              setScrollProgress(progress);
            } else {
              setIsHeroSection(false);
              setScrollProgress(0);
            }
          } else {
            setIsHeroSection(false);
            setScrollProgress(0);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Calculate dynamic dimensions for launcher using GPU transform scale
  const getLauncherStyles = () => {
    const isMobile = screenWidth <= 480;
    const isTablet = screenWidth > 480 && screenWidth <= 1024;

    let baseSize = 80;
    let scaleVal = 1;
    let rightPos = 40;
    let bottomPos = 36;

    if (isHeroSection) {
      if (isMobile) {
        // Mobile: 60px base, scale 1 -> 1.166 (60px -> 70px), right: 18px, bottom: 20px
        baseSize = 60;
        scaleVal = 1 + 0.166 * scrollProgress;
        rightPos = 18;
        bottomPos = 20;
      } else if (isTablet) {
        // Tablet: 72px base, scale 1 -> 1.138 (72px -> 82px), right: 28px, bottom: 28px
        baseSize = 72;
        scaleVal = 1 + 0.138 * scrollProgress;
        rightPos = 28;
        bottomPos = 28;
      } else {
        // Desktop: 80px base, scale 1 -> 1.10 (80px -> 88px max), right: 40px, bottom: 36px
        baseSize = 80;
        scaleVal = 1 + 0.10 * scrollProgress;
        rightPos = 40;
        bottomPos = 36;
      }
    } else {
      // Normal Page (past hero section): 60-64px base, scale 1
      if (isMobile) {
        baseSize = 60;
        scaleVal = 1;
        rightPos = 16;
        bottomPos = 18;
      } else if (isTablet) {
        baseSize = 60;
        scaleVal = 1;
        rightPos = 24;
        bottomPos = 24;
      } else {
        baseSize = 64;
        scaleVal = 1;
        rightPos = 28;
        bottomPos = 28;
      }
    }

    return {
      "--fab-size": `${baseSize}px`,
      "--fab-scale": scaleVal.toFixed(3),
      "--fab-right": `${rightPos}px`,
      "--fab-bottom": `${bottomPos}px`,
    };
  };

  const launcherStyleVars = getLauncherStyles();

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
    <div className="ai-chatbot-root" style={launcherStyleVars}>
      {/* Floating Trigger Button with Animated AI Avatar (Hidden when chatbot panel is open) */}
      {!isOpen && (
        <button
          ref={fabRef}
          className={`ai-chatbot-fab ${isTyping ? "is-processing" : ""}`}
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-label="Open AI Assistant"
        >
          <div className="ai-fab-glow"></div>
          <div className="ai-fab-content">
            <div className="ai-fab-icon-wrapper">
              <AIAssistantAvatar
                state={isTyping ? "thinking" : "idle"}
                size="100%"
              />
            </div>
            <span className="ai-fab-online-badge"></span>
          </div>
        </button>
      )}

      {/* Chat Panel Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            className="ai-chatbot-panel"
            role="dialog"
            aria-modal="true"
            aria-label="AI Assistant"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 8,
              transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            {/* Minimal Header with Robot Badge */}
            <div className="ai-chat-header">
              <div className="ai-chat-header-left">
                <div className="ai-header-icon-badge">
                  <AIAssistantAvatar state={isTyping ? "thinking" : "idle"} size={26} />
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
              {/* Centered Futuristic AI Robot Welcome Banner */}
              <div className="ai-welcome-banner">
                <div className="ai-profile-avatar-wrapper">
                  <AIAssistantAvatar
                    state={isTyping ? "thinking" : "idle"}
                    size={76}
                  />
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
