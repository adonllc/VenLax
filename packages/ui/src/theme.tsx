"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { colors, Theme } from "./tokens";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  surface: typeof colors.dark | typeof colors.light;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  surface: colors.dark,
});

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Web: apply data-theme attribute for Tailwind CSS variables
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, surface: colors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
