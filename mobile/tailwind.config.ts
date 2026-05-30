import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        hw: {
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
        },
      },
      boxShadow: {
        "hw-glow": "0 0 34px rgba(192,99,255,.25)",
        "hw-gold": "0 12px 34px rgba(255,189,84,.32)",
      },
    },
  },
} satisfies Config;
