import React from "react";
import "./StarBorder.css";

export default function StarBorder({
  as: Component = "div",
  className = "",
  color = "#7C3AED",
  speed = "7s",
  thickness = 1,
  children,
  ...props
}) {
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{
        "--star-color": color,
        "--star-speed": speed,
        "--star-thickness": `${thickness}px`,
      }}
      {...props}
    >
      <div className="star-border-glow" />
      <div className="star-border-effect" />
      <div className="star-border-inner">{children}</div>
    </Component>
  );
}
