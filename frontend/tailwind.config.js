/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101114",
        paper: "#F6F1E8",
        rust: "#C65D3A",
        teal: "#1E7A73",
        success: "#2E9F57",
        error: "#C0352B",
      },
      fontFamily: {
        display: ['"Sora"', '"Clash Display"', "sans-serif"],
        body: ['"Plus Jakarta Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
}
