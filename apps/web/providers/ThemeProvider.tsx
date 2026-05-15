"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function useThemeMode() {
  return useContext(Ctx);
}

export function ThemeModeProvider({
  children,
  initialTheme = "dark",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = useCallback(async () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      await fetch("/api/proxy/profile/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });
    } catch {
      // non-fatal — theme still applied locally
    }
  }, [theme]);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}
