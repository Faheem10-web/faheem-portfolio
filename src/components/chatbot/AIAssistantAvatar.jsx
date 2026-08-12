import React from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { motion } from "framer-motion";
import AIAssistantIcon from "./AIAssistantIcon";
import "./AIAssistantAvatar.css";

/**
 * Premium 3D Animated AI Robot Avatar Component
 * Rendered using the reference-inspired AIAssistantIcon vector asset with state-driven animations.
 * 
 * Props:
 * @param {'idle' | 'thinking' | 'talking' | 'welcome' | 'error'} state Current AI animation state
 * @param {number} size Pixel size (default 64)
 * @param {string} riveUrl Optional Rive asset URL (.riv)
 * @param {string} className Additional CSS classes
 */
export default function AIAssistantAvatar({
  state = "idle",
  size = 64,
  riveUrl = null,
  className = "",
}) {
  // If a valid .riv URL is provided, render using Rive React Canvas
  const { RiveComponent, rive } = useRive(
    riveUrl
      ? {
          src: riveUrl,
          autoplay: true,
          layout: new Layout({
            fit: Fit.Contain,
            alignment: Alignment.Center,
          }),
        }
      : null
  );

  // Trigger Rive animation state inputs if Rive instance exists
  React.useEffect(() => {
    if (rive) {
      try {
        const inputs = rive.stateMachineInputs("State Machine 1");
        if (inputs && inputs.length > 0) {
          const trigger = inputs.find((i) => i.name.toLowerCase() === state.toLowerCase());
          if (trigger) trigger.fire();
        }
      } catch (e) {
        // Fallback gracefully if state machine inputs aren't mapped
      }
    }
  }, [state, rive]);

  // If Rive URL is provided and component loaded, render Rive Canvas
  if (riveUrl && RiveComponent) {
    return (
      <div
        className={`ai-robot-avatar-root rive-mode ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        role="img"
        aria-label={`AI Assistant Robot (${state})`}
      >
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

  const isThinking = state === "thinking";
  const isTalking = state === "talking";

  return (
    <motion.div
      className={`ai-robot-avatar-root ${state} ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      role="img"
      aria-label={`AI Assistant Avatar (${state})`}
      animate={
        isThinking
          ? { y: [0, -4, 0], rotate: [-3, 3, -3], scale: [1, 1.04, 1] }
          : isTalking
          ? { y: [-1, 2, -1], scale: [1, 1.02, 1] }
          : { y: [-2, 2, -2] }
      }
      transition={{
        duration: isThinking ? 1.2 : isTalking ? 0.8 : 3.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Outer Soft Ambient Purple/Cyan Glow */}
      <div
        className="ai-robot-outer-glow"
        style={{
          background: isThinking
            ? "radial-gradient(circle, rgba(34, 211, 238, 0.45) 0%, rgba(124, 58, 237, 0.3) 60%, transparent 80%)"
            : "radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(167, 139, 250, 0.2) 65%, transparent 85%)",
        }}
      />

      <AIAssistantIcon size={size} />
    </motion.div>
  );
}
