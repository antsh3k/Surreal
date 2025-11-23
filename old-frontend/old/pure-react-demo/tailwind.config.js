/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        preference: {
          liked: '#10B981',
          uncertain: '#F59E0B', 
          neutral: '#6B7280'
        }
      },
      animation: {
        'node-appear': 'nodeAppear 0.4s ease-out',
        'preference-glow': 'preferenceGlow 2s ease-in-out infinite',
      },
      keyframes: {
        nodeAppear: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        preferenceGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 2px currentColor)' },
          '50%': { filter: 'drop-shadow(0 0 8px currentColor)' }
        }
      }
    },
  },
  plugins: [],
}