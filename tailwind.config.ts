import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f0f7f3",
          100: "#dcf0e4",
          200: "#b9e2cb",
          300: "#8bcdab",
          400: "#55b187",
          500: "#36946a",
          600: "#277653",
          700: "#215f44",
          800: "#1d4c38",
          900: "#183e2f",
          950: "#0c221a",
        },
        surface: {
          light: "#f8faf9",
          card: "#ffffff",
          muted: "#f1f5f3",
          border: "#e5eae7",
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(15, 30, 20, 0.04)",
        card: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 25px -5px rgba(27, 67, 50, 0.08), 0 8px 10px -6px rgba(27, 67, 50, 0.04)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
