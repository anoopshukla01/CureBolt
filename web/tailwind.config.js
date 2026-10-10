/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blinkit: {
          green: '#0c831f',
          greenHover: '#16a34a',
          yellow: '#f8cb46',
          dark: '#121212',
          card: '#1a1a1e',
          border: '#27272b'
        }
      }
    },
  },
  plugins: [],
}
