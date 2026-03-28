import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1b2a",
        seafoam: "#d4f4ec",
        ember: "#f08a5d",
        gold: "#f2cc8f"
      },
      boxShadow: {
        card: "0 20px 45px rgba(13, 27, 42, 0.12)"
      },
      fontFamily: {
        sans: ["Segoe UI Variable Display", "Trebuchet MS", "Verdana", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
