/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#101426",
          50: "#f4f5f8",
          100: "#e5e7ef",
          200: "#c3c8d8",
          300: "#9aa2ba",
          400: "#6b7392",
          500: "#4a5074",
          600: "#363a5c",
          700: "#272a47",
          800: "#1a1d36",
          900: "#101426",
          950: "#0a0c19",
        },
        brand: {
          50: "#f1effb",
          100: "#e1defb",
          200: "#c3bcf5",
          300: "#a293ee",
          400: "#8069e3",
          500: "#5f45d1",
          600: "#4a34b0",
          700: "#3b2a8b",
          800: "#2f2270",
          900: "#241a55",
        },
        amber: {
          50: "#fef8ec",
          100: "#fdecc4",
          200: "#fad98c",
          300: "#f6c158",
          400: "#f2a93b",
          500: "#e78e1f",
          600: "#c56f16",
          700: "#985316",
          800: "#7a4319",
          900: "#66381a",
        },
        paper: "#ecebe6",
        emerald: {
          50: "#eafaf3",
          100: "#cdf3e2",
          400: "#28b788",
          500: "#12866f",
          600: "#0d6b5b",
        },
        rose: {
          50: "#fdecec",
          100: "#f9cfcd",
          400: "#e05a53",
          500: "#c4433d",
          600: "#a3332e",
        },
      },
      fontFamily: {
        display: ["var(--font-manrope)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 20, 38, 0.04), 0 8px 24px -12px rgba(16, 20, 38, 0.12)",
        card: "0 1px 1px rgba(16, 20, 38, 0.03), 0 2px 8px rgba(16, 20, 38, 0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
