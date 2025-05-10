/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Include all JS, TS, JSX, TSX files in src
  ],
  theme: {
    extend: {
      colors: {
        "brand-dark": "#1a202c", // Very dark grey, almost black (e.g., for main background)
        "brand-dark-secondary": "#2d3748", // Darker grey (e.g., for sidebar, card backgrounds)
        "brand-light": "#f7fafc", // Off-white (e.g., for text on dark backgrounds)
        "brand-light-secondary": "#e2e8f0", // Slightly darker off-white (e.g., secondary text)
        "brand-blue": "#3b82f6", // Primary blue accent
        "brand-blue-hover": "#2563eb", // Darker blue for hover states
      },
    },
  },
  plugins: [],
};
