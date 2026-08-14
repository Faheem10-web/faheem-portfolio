import React from "react";
import "./AIAssistantAvatar.css";

/**
 * Premium AI Robot Avatar Component using exact chatbot asset (/assets/chatbot-cropped.png)
 * Features ultra-subtle continuous 4s CSS floating animation (translate3d 0, -4px, 0 scale 1.012).
 */
export default function AIAssistantAvatar({
  state = "idle",
  size = 50,
  className = "",
  src = "/assets/chatboart.png"
}) {
  const sizeStyle = typeof size === "number" ? `${size}px` : size;

  let animClass = "is-idle";
  if (state === "open" || className.includes("paused")) {
    animClass = "is-open";
  } else if (state === "thinking") {
    animClass = "is-thinking";
  } else if (state === "talking") {
    animClass = "is-talking";
  }

  return (
    <div
      className={`ai-robot-avatar-wrapper ${state} ${className}`}
      style={{
        width: sizeStyle,
        height: sizeStyle,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      role="img"
      aria-label="AI Assistant Robot Avatar"
    >
      <img
        src={src}
        alt="AI Assistant Robot"
        className={`ai-robot-floating-img ${animClass}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
