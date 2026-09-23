import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f8fafc",
        surface: "#ffffff",
        subtle: "#f1f5f9",
        navy: {
          950: "#060f1e",
          900: "#0b1e3b",
          800: "#132d54",
          700: "#1e4070",
          600: "#2a548e",
        },
        ocean: {
          600: "#0284c7",
          500: "#0ea5e9",
          400: "#38bdf8",
          100: "#e0f2fe",
          50: "#f0f9ff",
        },
        eco: {
          700: "#047857",
          600: "#059669",
          500: "#10b981",
          100: "#d1fae5",
          50: "#ecfdf5",
        },
        sand: {
          200: "#e7e2d7",
          100: "#f3f0ea",
          50: "#fbfaf8",
        },
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(11, 30, 59, 0.04), 0 1px 2px rgba(11, 30, 59, 0.02)",
        card: "0 8px 24px -4px rgba(11, 30, 59, 0.06), 0 4px 12px -2px rgba(11, 30, 59, 0.03)",
        elevated: "0 20px 40px -10px rgba(11, 30, 59, 0.08), 0 8px 16px -4px rgba(11, 30, 59, 0.04)",
        focus: "0 0 0 3px rgba(2, 132, 199, 0.2)",
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "Playfair Display",
          "Georgia",
          "Cambria",
          "serif",
        ],
        editorial: [
          "Playfair Display",
          "Georgia",
          "serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
