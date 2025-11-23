/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        preference: {
          liked: '#10B981',        // Green for high preference
          uncertain: '#F59E0B',    // Orange for uncertain relevance
          neutral: '#6B7280'       // Gray for neutral
        },
        mindcanvas: {
          background: '#FAFAFA',   // Subtle gray background
          paper: '#FFFFFF',        // Pure white for nodes
          ink: '#111827',          // Dark text
          border: '#E5E5E5'        // Light borders
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'ripple': 'ripple 1.2s ease-out',
        'node-appear': 'nodeAppear 0.4s ease-out',
        'preference-glow': 'preferenceGlow 2s ease-in-out infinite'
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' }
        },
        nodeAppear: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        preferenceGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' }
        }
      }
    },
  },
  plugins: [],
}

