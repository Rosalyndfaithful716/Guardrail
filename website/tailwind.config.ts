import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amber: {
          brand: "#d4a012",
        },
      },
      fontFamily: {
        mono: ['"SF Mono"', '"Fira Code"', "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
