export const colors = {
  // ── Signature brand colors (identical in both themes) ─────────────────────
  green: "#00D46A",
  greenDark: "#00A854",
  greenGlowDark: "rgba(0, 212, 106, 0.20)",
  greenGlowLight: "rgba(0, 212, 106, 0.14)",

  lemon: "#FFE600",
  lemonSoftDark: "rgba(255, 230, 0, 0.15)",
  lemonSoftLight: "rgba(255, 230, 0, 0.07)",

  orange: "#FF6B00",
  orangeDark: "#D45A00",
  orangeGlowDark: "rgba(255, 107, 0, 0.18)",
  orangeGlowLight: "rgba(255, 107, 0, 0.12)",

  // ── Danger (admin/destructive only — never use in product UI) ─────────────
  danger: "#FF3B30",

  // ── Dark theme surfaces ───────────────────────────────────────────────────
  dark: {
    surface: "#0D0D0D",
    surface2: "#181818",
    surface3: "#242424",
    border: "#2E2E2E",
    textPrimary: "#F5F5F5",
    textSecondary: "#8A8A8A",
  },

  // ── Light theme surfaces (Intense Green + Lemon + Dark Grey) ─────────────
  light: {
    surface: "#1A231A",
    surface2: "#243024",
    surface3: "#2E3D2E",
    border: "#3A4F3A",
    textPrimary: "#D6F5D6",
    textSecondary: "#7AAF7A",
    lemonTint: "rgba(255,230,0,0.07)",
    greenTint: "rgba(0,212,106,0.10)",
  },
} as const;

export const typography = {
  fontHeading: "Outfit",
  fontBody: "Inter",
  fontMono: "JetBrains Mono",
  weights: { regular: "400", medium: "500", semibold: "600", bold: "700", extrabold: "800" },
  sizes: {
    xs: 10, sm: 12, base: 14, md: 16, lg: 18, xl: 24, xxl: 32,
  },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  sm: 6, md: 12, lg: 20, full: 9999,
} as const;

export type Theme = "dark" | "light";

export function getSurface(theme: Theme) {
  return colors[theme];
}
