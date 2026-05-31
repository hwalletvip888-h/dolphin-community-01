import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}"
  ],
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
          red: "#FF6D72"
        }
      },
      boxShadow: {
        "hw-glow": "0 0 34px rgba(192,99,255,.25), 0 24px 74px rgba(0,0,0,.55)",
        "hw-gold": "0 12px 34px rgba(255,189,84,.32), inset 0 1px 0 rgba(255,255,255,.55)"
      }
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
