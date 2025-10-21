/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Include all JS, TS, JSX, TSX files in src
  ],
  plugins: [typography],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#3b82f6", // Primary blue accent
        "brand-blue-hover": "#2563eb", // Darker blue for hover states
        "brand-dark": "#1a202c", // Very dark grey, almost black (e.g., for main background)
        "brand-dark-secondary": "#2d3748", // Darker grey (e.g., for sidebar, card backgrounds)
        "brand-light": "#f7fafc", // Off-white (e.g., for text on dark backgrounds)
        "brand-light-secondary": "#e2e8f0", // Slightly darker off-white (e.g., secondary text)
        // PW theme mapped from CSS variables in src/index.css
        "pw-bg-0": "#5e5e5e",
        "pw-bg-1": "#040405",
        "pw-bg-2": "#15161a",
        "pw-bg-3": "#1c1d22",
        "pw-card": "rgba(239, 68, 68, 0.06)",
        "pw-border": "rgba(255, 255, 255, 0.08)",
        "pw-text": "#f9fafb",
        "pw-muted": "#a1a1aa",
        "pw-accent-1": "#ef4444", // red-500
        "pw-accent-2": "#dc2626", // red-600
        "pw-accent-3": "#b91c1c", // red-700
      },
      typography: ({ theme }) => ({
        invert: {
          css: {
            "--tw-prose-body": theme("colors.brand-light"),
            "--tw-prose-bold": theme("colors.brand-light"),
            "--tw-prose-bullets": theme("colors.brand-light-secondary"),
            "--tw-prose-captions": theme("colors.brand-light-secondary"),
            "--tw-prose-code": theme("colors.brand-light"),
            "--tw-prose-counters": theme("colors.brand-light-secondary"),
            "--tw-prose-headings": theme("colors.brand-light"),
            "--tw-prose-hr": theme("colors.brand-light-secondary"),
            "--tw-prose-links": theme("colors.brand-blue"),
            "--tw-prose-pre-bg": theme("colors.brand-dark-secondary"),
            "--tw-prose-pre-code": theme("colors.brand-light"),
            "--tw-prose-quote-borders": theme("colors.brand-light-secondary"),
            "--tw-prose-quotes": theme("colors.brand-light"),
            "--tw-prose-td-borders": theme("colors.brand-light-secondary"),
            "--tw-prose-th-borders": theme("colors.brand-light-secondary"),
          },
        },
      }),
    },
  },
};
