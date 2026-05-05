import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sintese: {
          50: "#ecfeff",
          100: "#cffafe",
          500: "#0891b2",
          600: "#0e7490",
          700: "#155e75",
          900: "#0c3547"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;

