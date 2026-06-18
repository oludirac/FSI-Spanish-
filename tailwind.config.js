/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#141414",
        border: "#262626",
        accent: "#22c55e",
        fail: "#ef4444",
        muted: "#737373",
      },
      animation: {
        pulse_mic: "pulse_mic 1.5s ease-in-out infinite",
      },
      keyframes: {
        pulse_mic: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.15)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
