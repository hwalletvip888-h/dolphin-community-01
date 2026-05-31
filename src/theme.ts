// Dolphin V2 — Design tokens from UI spec
// Deep purple-black + gold-purple gradient + glass cards

export const color = {
  // Backgrounds
  bg: "#090012",
  bgCard: "rgba(26,6,51,0.92)",
  bgGlass: "rgba(35,10,62,0.72)",
  bgInput: "rgba(255,255,255,0.06)",

  // Purple scale
  purple: "#8A3FFC",
  purpleLight: "#C063FF",
  purpleDark: "#1A0633",

  // Gold scale
  gold: "#F7D56D",
  goldDark: "#C8912D",

  // Text
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.58)",
  textMuted: "rgba(255,255,255,0.35)",

  // Borders
  border: "rgba(192,99,255,0.28)",
  borderLight: "rgba(255,255,255,0.08)",

  // Semantic
  success: "#34D399",
  danger: "#FB923C",
  info: "#38BDF8",
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const font = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    hero: 36,
  },
  weight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    black: "900" as const,
  },
};

export const shadow = {
  glow: (c: string) => ({
    shadowColor: c,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  }),
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
