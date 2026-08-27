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
    },
  },
  plugins: [],
};

export default config;
