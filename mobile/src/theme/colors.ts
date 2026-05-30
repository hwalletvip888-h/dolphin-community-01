// Dolphin Community design tokens — mobile theme
// Mirrors web: tailwind.config.ts + globals.css

export const colors = {
  bg0: "#050015",
  bg1: "#100022",
  bg2: "#250044",
  gold: "#F7D56D",
  gold2: "#FFBD54",
  purple: "#8F46D9",
  purple2: "#C063FF",
  text: "#FFF5D9",
  green: "#55F59A",
  red: "#FF6D72",
  card: "#1A0633",
  muted: "rgba(235,216,255,0.72)",
  accent: "#8A3FFC",
} as const;

export const gradients = {
  goldButton: ["#fff0a8", "#f7c65f", "#c97e22"] as const,
  goldText: ["#fff4aa", "#f7d56d", "#c9852b"] as const,
  cardBg: ["#341258", "#0e032a"] as const,
} as const;

export const shadows = {
  glow: {
    shadowColor: "#C063FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 34,
    elevation: 20,
  },
  gold: {
    shadowColor: "#FFBD54",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 34,
    elevation: 16,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 74,
    elevation: 24,
  },
} as const;
