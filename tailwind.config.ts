import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f1115",
        surface: "#1a1d24",
        border: "#2a2d35",
        accent: "#4f7cff",
        gold: "#ffd76a",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        glowSettle: {
          "0%": { boxShadow: "0 0 0 0 rgba(255, 215, 106, 0)" },
          "40%": { boxShadow: "0 0 16px 2px rgba(255, 215, 106, 0.5)" },
          "100%": { boxShadow: "0 0 8px 0 rgba(255, 215, 106, 0.22)" },
        },
        underlineDraw: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-slide-up": "fadeSlideUp 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "glow-settle": "glowSettle 1.1s cubic-bezier(0.16,1,0.3,1) both",
        "underline-draw": "underlineDraw 0.45s cubic-bezier(0.16,1,0.3,1) 0.35s both",
      },
    },
  },
  plugins: [],
};

export default config;
