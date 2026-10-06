/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff9f7",
          100: "#d7f0ea",
          200: "#aee1d6",
          300: "#7dccbc",
          400: "#4bb09c",
          500: "#2f9482",
          600: "#22766a",
          700: "#1e5f57",
          800: "#1c4c47",
          900: "#193f3b",
        },
      },
    },
  },
  plugins: [],
};
