/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2EC4B6', // Teal - Medical/Modern
        secondary: '#0B1222', // Deeper Navy
        accent: '#FF9F1C', // Amber accent
        background: '#F9FAFB', // Zinc 50 equivalent
        surface: 'rgba(255, 255, 255, 0.95)',
        'surface-tint': '#2EC4B6',
        'primary-container': '#E6FFFA'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '24px',
      }
    },
  },
  plugins: [],
}
