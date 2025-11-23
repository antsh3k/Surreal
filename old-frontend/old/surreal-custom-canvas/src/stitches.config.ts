import { createStitches } from '@stitches/react'

export const {
  styled,
  css,
  globalCss,
  keyframes,
  getCssText,
  theme,
  createTheme,
  config,
} = createStitches({
  theme: {
    colors: {
      // Hand-drawn inspired palette
      paper: '#FEFCF3', // Warm paper white
      ink: '#2A2B2A',   // Natural ink black
      pencil: '#6B7280', // Pencil gray
      highlight: '#FEF08A', // Yellow highlighter
      liked: '#A7F3D0',   // Soft green 
      uncertain: '#FED7AA', // Soft orange
      purple: '#D8B4FE',   // Soft purple accents
    },
    space: {
      1: '5px',
      2: '10px', 
      3: '15px',
      4: '20px',
      5: '25px',
      6: '35px',
    },
    fonts: {
      handwritten: 'Caveat, cursive',
      reading: 'Inter, system-ui, sans-serif',
    },
    fontSizes: {
      1: '12px',
      2: '14px',
      3: '16px',
      4: '18px',
      5: '20px',
      6: '24px',
    },
    radii: {
      1: '4px',
      2: '8px',
      3: '12px',
      round: '50%',
    }
  }
})

// Global styles for hand-drawn feel
export const globalStyles = globalCss({
  '*': {
    boxSizing: 'border-box',
  },
  body: {
    backgroundColor: '$paper',
    color: '$ink',
    fontFamily: '$reading',
    margin: 0,
    padding: 0,
    // Subtle paper texture
    backgroundImage: `
      radial-gradient(circle at 1px 1px, rgba(0,0,0,.15) 1px, transparent 0),
      radial-gradient(circle at 1px 1px, rgba(0,0,0,.05) 1px, transparent 0)
    `,
    backgroundSize: '20px 20px, 40px 40px',
  },
})