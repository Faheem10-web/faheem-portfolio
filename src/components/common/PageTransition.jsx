import React from 'react';
import { motion } from 'framer-motion';
import './PageTransition.css';

// GPU-accelerated 60 FPS page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    transform: 'translate3d(0, 16px, 0)'
  },
  animate: {
    opacity: 1,
    transform: 'translate3d(0, 0px, 0)',
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    transform: 'translate3d(0, -12px, 0)',
    transition: {
      duration: 0.25,
      ease: [0.76, 0, 0.24, 1]
    }
  }
};

export const curtainVariants = {
  initial: {
    transform: 'translate3d(0, 100%, 0)'
  },
  animate: {
    transform: 'translate3d(0, 0%, 0)',
    transition: {
      duration: 0.28,
      ease: [0.76, 0, 0.24, 1]
    }
  },
  exit: {
    transform: 'translate3d(0, -100%, 0)',
    transition: {
      duration: 0.32,
      ease: [0.76, 0, 0.24, 1]
    }
  }
};

export function PageTransitionOverlay() {
  return (
    <motion.div
      className="page-transition-curtain"
      variants={curtainVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    />
  );
}

export function PageWrapper({ children }) {
  return (
    <motion.div
      className="page-transition-wrapper"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
