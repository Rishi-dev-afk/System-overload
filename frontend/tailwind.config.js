/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0a0a',
        'dark-card': '#1a1a1a',
        'dark-border': '#2a2a2a',
        'accent-blue': '#00d4ff',
        'accent-purple': '#8b5cf6',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0a0',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}