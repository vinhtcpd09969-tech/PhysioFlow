/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2EC4B6',
        secondary: '#0F172A',
        accent: '#38BDF8',
        background: '#F8FAFC',
        surface: 'rgba(255, 255, 255, 0.9)',
        'surface-tint': '#006a62',
        'primary-container': '#2ec4b6'
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
