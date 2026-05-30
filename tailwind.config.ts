import type { Config } from "tailwindcss";

// Vortex palette (spec §7.4). `ink` is primary text — named to avoid clobbering
// Tailwind's built-in `white`. Company pills derive color from health, not brand.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0C10",
        green: "#4ECDC4",
        amber: "#F0AD4E",
        red: "#FF6B6B",
        blue: "#7EB8DA",
        plum: "#B8A0D2",
        rose: "#E8849A",
        ink: "#E8E6E1",
      },
      fontFamily: {
        sans: ["var(--font-lexend)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        app: "500px",
      },
    },
  },
  plugins: [],
};
export default config;
