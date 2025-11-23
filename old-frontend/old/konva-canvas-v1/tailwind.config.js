/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'preference': {
          'green': '#10B981',
          'green-bg': '#F0FDF4',
          'orange': '#F59E0B',
          'orange-bg': '#FEF3C7',
          'neutral': '#E5E5E5',
          'uncertain': '#CCCCCC',
        }
      },
      animation: {
        'node-appear': 'nodeAppear 0.4s ease-out',
        'preference-change': 'preferenceChange 0.5s ease-in-out',
      },
      keyframes: {
        nodeAppear: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        preferenceChange: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}