/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1', // Indigo
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        profit: '#10b981', // Emerald
        cost: '#f43f5e',   // Rose
        alert: '#f97316',  // Orange
      }
    },
  },
  plugins: [],
}