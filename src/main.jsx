import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App";

// Initialize theme synchronously before render to prevent flickering
const savedTheme = localStorage.getItem('admin-theme') || 'light';
if (savedTheme === 'dark') {
  document.documentElement.classList.add('admin-dark-theme');
  document.documentElement.classList.remove('admin-light-theme');
} else {
  document.documentElement.classList.add('admin-light-theme');
  document.documentElement.classList.remove('admin-dark-theme');
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);