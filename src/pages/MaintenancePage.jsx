import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './MaintenancePage.css';

export default function MaintenancePage() {
  // Dynamically set title for Maintenance page
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Portfolio Update | Faheem A V';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  return (
    <div className="maintenance-body">
      <header className="maintenance-header">
        <div className="maintenance-logo">FAHEEM</div>
        <div className="maintenance-label">PORTFOLIO UPDATE</div>
      </header>

      <main className="maintenance-content">
        <motion.h1 
          className="maintenance-heading"
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          I'm refining the experience.
        </motion.h1>
        
        <motion.p 
          className="maintenance-description"
          initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          My portfolio is currently being updated with new work and improved experiences. I'll be back soon.
        </motion.p>
        
        <motion.div 
          className="maintenance-status-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="maintenance-dot-wrapper">
            <div className="maintenance-dot-pulse" />
            <div className="maintenance-dot" />
          </div>
          <span>Currently updating</span>
        </motion.div>
      </main>

      <footer className="maintenance-footer">
        <div>Faheem A V — UI/UX Designer</div>
        <div className="maintenance-copyright">© 2026 FAHEEM. ALL RIGHTS RESERVED.</div>
      </footer>
    </div>
  );
}
