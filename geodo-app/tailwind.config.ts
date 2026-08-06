import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        background: "#05050a",
        foreground: "#f4f4f7",
        border: "rgba(255,255,255,0.08)",
        card: "rgba(255,255,255,0.04)",
        primary: {
          DEFAULT: "#ff5a1f",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#0f0f16",
          foreground: "#9a9aa8",
        },
        accent: {
          DEFAULT: "#7c6cff",
          foreground: "#ffffff",
        },
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        blob: "blob 12s infinite ease-in-out",
        "fade-up": "fade-up 0.5s ease-out forwards",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
