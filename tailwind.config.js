/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F5",
        "paper-dim": "#F1EFE8",
        ink: {
          DEFAULT: "#171C26",
          800: "#1F2633",
          700: "#2A3242",
          600: "#3A4457",
          500: "#5B6578",
          400: "#8991A0",
          300: "#B7BEC9",
          200: "#DEE1E6",
          100: "#EDEFF2",
        },
        rule: "#DAD4C4",
        stamp: {
          DEFAULT: "#1F7A5C",
          light: "#E4F1EC",
          dark: "#155940",
        },
        rust: {
          DEFAULT: "#B54834",
          light: "#F7E7E2",
          dark: "#8A3626",
        },
        amber: {
          DEFAULT: "#C8862A",
          light: "#FBEEDC",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          '"IBM Plex Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      backgroundImage: {
        "ledger-lines":
          "repeating-linear-gradient(transparent, transparent 27px, #DAD4C4 28px)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 28, 38, 0.04), 0 1px 1px rgba(23, 28, 38, 0.03)",
      },
    },
  },
  plugins: [],
};
