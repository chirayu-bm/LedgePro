export const theme = {
  colors: {
    bgMain: "#0F1115",
    bgSecondary: "#151821",
    glass: "rgba(255,255,255,0.05)",
    glassBorder: "rgba(255,255,255,0.08)",
    glassHover: "rgba(255,255,255,0.1)",
    orange: "#FF7A00",
    orangeGlow: "rgba(255,122,0,0.3)",
    green: "#22C55E",
    red: "#EF4444",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.6)",
    textMuted: "rgba(255,255,255,0.4)",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
  },
  shadow: {
    soft: "0 8px 32px rgba(0,0,0,0.3)",
    glow: "0 0 20px rgba(255,122,0,0.15)",
    card: "0 4px 24px rgba(0,0,0,0.2)",
  },
  motion: {
    fast: 0.3,
    normal: 0.5,
    slow: 0.6,
    easing: [0.25, 0.1, 0.25, 1] as const,
  },
} as const;

export type Theme = typeof theme;
