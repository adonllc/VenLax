"use client";

import { useThemeMode } from "@/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useThemeMode();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 10px",
        borderRadius: "20px",
        border: "1px solid var(--color-border)",
        background: "transparent",
        cursor: "pointer",
        transition: "all 0.2s",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--color-text-secondary)",
      }}
      className="theme-toggle-btn"
    >
      <span style={{ fontSize: "14px" }}>{isDark ? "☀️" : "🌙"}</span>
      <span style={{ fontSize: "11px" }}>{isDark ? "Light" : "Dark"}</span>
      <style>{`
        .theme-toggle-btn:hover {
          border-color: var(--color-green) !important;
          color: var(--color-green) !important;
        }
      `}</style>
    </button>
  );
}
