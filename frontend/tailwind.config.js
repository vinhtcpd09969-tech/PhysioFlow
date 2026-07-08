/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        'primary-container': '#E6FFFA',
        'surface-container': '#F0FDFB', // Soft teal-white
        'surface-container-low': '#F7FDFD',
        'surface-container-high': '#CCFBF1',
        'surface-container-highest': '#99F6E4',
        'on-surface': '#0B1222',
        'outline-variant': '#E2E8F0',
      },
      spacing: {
        'margin-desktop': '40px',
        'margin-mobile': '16px',
        'xxl': '48px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '24px',
      },
      boxShadow: {
        'soft-ui': '0 30px 60px -15px rgba(0, 0, 0, 0.03), 0 15px 30px -10px rgba(0, 0, 0, 0.02)',
        'soft-ui-hover': '0 40px 80px -15px rgba(0, 0, 0, 0.06), 0 20px 40px -10px rgba(0, 0, 0, 0.04)',
        'soft-button': '0 10px 25px -5px rgba(46, 196, 182, 0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-primary': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(46, 196, 182, 0.4)' },
          '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 15px rgba(46, 196, 182, 0)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(46, 196, 182, 0)' },
        },
        'wave-move': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-custom': 'pulse-primary 2s infinite',
        'wave-move': 'wave-move 10s linear infinite',
        'marquee': 'marquee 30s linear infinite',
      }
    },
  },
  plugins: [],
}
