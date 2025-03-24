/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./game/**/*.{js,jsx,ts,tsx,html}",  // Scans all JS/TS/HTML files in the game directory
    "./src/**/*.{js,jsx,ts,tsx,html}"     // Include src directory if needed
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}