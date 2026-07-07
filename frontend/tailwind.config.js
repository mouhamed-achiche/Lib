/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "academic-blue": "#2C3C4D",
        "oxford-red": "#E2231A",
        background: "#fbf9fa",
        surface: "#fbf9fa",
        "surface-container": "#efedef",
        "surface-container-high": "#eae7e9",
        "surface-container-low": "#f5f3f4",
        "surface-variant": "#e4e2e3",
        "muted-gray": "#F4F7F9",
        "paper-white": "#FDFDFD",
        "ink-black": "#1A1A1A",
        "on-surface": "#1b1c1d",
        "on-surface-variant": "#44474c",
        outline: "#74777d",
        "outline-variant": "#c4c6cc",
        primary: "#162636",
        secondary: "#bc0005",
        error: "#ba1a1a",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Hanken Grotesk", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
    },
  },
  plugins: [],
};
