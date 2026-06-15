/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cloud: "rgb(var(--cloud) / <alpha-value>)",
        snow: "rgb(var(--snow) / <alpha-value>)",
        graphite: "rgb(var(--graphite) / <alpha-value>)",
        slate2: "rgb(var(--slate2) / <alpha-value>)",
        hair: "rgb(var(--hair) / <alpha-value>)",
        gold: "#F5A623",
        ember: "#FF6A00",
        ink: "#0A0A0F",
      },
      fontFamily: {
        sans: ["-apple-system","BlinkMacSystemFont","SF Pro Display","Inter","Segoe UI","Roboto","Helvetica Neue","Arial","sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.12)",
        lift: "0 2px 4px rgba(0,0,0,0.05), 0 20px 48px -16px rgba(0,0,0,0.18)",
        glow: "0 10px 30px -8px rgba(245,166,35,0.45)",
      },
    },
  },
  plugins: [],
};
