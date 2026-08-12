import React from "react";

/**
 * Premium Minimalist AI Assistant Icon Component
 * Inspired by reference design: spherical white shell, glossy dark visor, neon purple->cyan ring gradient, glowing white oval eyes.
 * 
 * Scalable from 32px to 128px (default 64).
 */
export default function AIAssistantIcon({ size = 64, className = "" }) {
  return (
    <div
      className={`ai-assistant-icon-root ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* White 3D Glossy Shell Gradient */}
          <radialGradient id="iconShellGradient" cx="40%" cy="30%" r="70%" fx="40%" fy="30%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </radialGradient>

          {/* Shell Top Specular Highlight */}
          <linearGradient id="iconShellHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Purple -> Violet -> Electric Blue -> Cyan Ring Gradient */}
          <linearGradient id="iconNeonRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="30%" stopColor="#8B5CF6" />
            <stop offset="70%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>

          {/* Dark Glossy Visor Gradient */}
          <linearGradient id="iconVisorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="40%" stopColor="#080B16" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Visor Reflection Highlight */}
          <linearGradient id="iconVisorGlassReflect" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Eye Glow Filter */}
          <filter id="iconEyeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Outer Soft Purple/Cyan Ambient Glow */}
          <filter id="iconOuterGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#7C3AED" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* Main Outer Spherical White Shell */}
        <circle cx="64" cy="64" r="56" fill="url(#iconShellGradient)" filter="url(#iconOuterGlow)" />

        {/* Shell Inner Subtle Rim */}
        <circle cx="64" cy="64" r="55.5" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1" />

        {/* Top Curved Glass Dome Reflection */}
        <path d="M 22 44 A 52 52 0 0 1 106 44 A 56 56 0 0 0 22 44 Z" fill="url(#iconShellHighlight)" />

        {/* Neon Gradient Border Ring */}
        <rect x="21" y="35" width="86" height="58" rx="29" fill="url(#iconNeonRingGrad)" />

        {/* Inner Dark Glossy Visor Panel */}
        <rect x="24" y="38" width="80" height="52" rx="26" fill="url(#iconVisorGradient)" />

        {/* Visor Top Glass Reflection Streak */}
        <path d="M 27 48 Q 64 39 101 48 C 98 42, 90 40, 78 40 L 50 40 C 38 40, 30 42, 27 48 Z" fill="url(#iconVisorGlassReflect)" />

        {/* Left Glowing White Oval Eye */}
        <g filter="url(#iconEyeGlow)">
          <ellipse cx="46" cy="64" rx="9" ry="14" fill="#FFFFFF" />
          <circle cx="48.5" cy="60.5" r="2.8" fill="#FFFFFF" />
        </g>

        {/* Right Glowing White Oval Eye */}
        <g filter="url(#iconEyeGlow)">
          <ellipse cx="82" cy="64" rx="9" ry="14" fill="#FFFFFF" />
          <circle cx="84.5" cy="60.5" r="2.8" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}
