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
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s infinite linear',
      }
    },
  },
  plugins: [],
}
