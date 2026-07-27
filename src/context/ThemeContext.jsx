import React, { createContext, useContext, useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const { siteSettings } = useAdmin();
    const [themeMode, setThemeMode] = useState("system"); // "system", "user", "light", "dark"
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) return savedTheme;
        return "light";
    });
    const [showToggle, setShowToggle] = useState(true);

    // Sync themeMode when backend configuration loads
    useEffect(() => {
        if (siteSettings && siteSettings.theme) {
            setThemeMode(siteSettings.theme.mode || "system");
        }
    }, [siteSettings]);

    // Handle System scheme listener (updates automatically when OS theme changes in system mode)
    useEffect(() => {
        if (themeMode !== "system") return;

        const handleSystemChange = () => {
            const savedOverride = localStorage.getItem("theme_override");
            if (!savedOverride) {
                setTheme("light");
            }
        };

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", handleSystemChange);
        return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }, [themeMode]);

    // Apply configuration when themeMode changes
    useEffect(() => {
        if (themeMode === "light") {
            setTheme("light");
            setShowToggle(false);
        } else if (themeMode === "dark") {
            setTheme("dark");
            setShowToggle(false);
        } else if (themeMode === "system") {
            setShowToggle(true);
            const savedOverride = localStorage.getItem("theme_override");
            if (savedOverride) {
                setTheme(savedOverride);
            } else {
                setTheme("light");
            }
        } else if (themeMode === "user") {
            setShowToggle(true);
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme) {
                setTheme(savedTheme);
            } else {
                setTheme("light");
            }
        }
    }, [themeMode]);

    // Apply active theme class/attributes to document root and persist preferences
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);

        if (themeMode === "user") {
            localStorage.setItem("theme", theme);
        } else if (themeMode === "system") {
            localStorage.setItem("theme_override", theme);
        }
    }, [theme, themeMode]);

    const toggleTheme = () => {
        if (themeMode === "system" || themeMode === "user") {
            setTheme(prev => (prev === "dark" ? "light" : "dark"));
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, themeMode, showToggle, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
