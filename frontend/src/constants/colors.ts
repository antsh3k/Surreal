// MindCanvas Color Palette
// Base colors: grey/black/white for minimal design
// Accent colors: used sparingly for specific purposes

export const colors = {
  // Base colors (primary use)
  black: '#0a0a0a',
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  white: '#ffffff',

  // Accent colors (use sparingly for specific meanings)
  blue: '#3b82f6',      // Information, focus states
  purple: '#a855f7',    // High importance, featured items
  green: '#10b981',     // Success, positive actions
  orange: '#f97316',    // Warning, attention needed
}

// Semantic color usage
export const semantic = {
  text: {
    primary: colors.black,
    secondary: colors.grey[600],
    tertiary: colors.grey[400],
    inverse: colors.white,
  },
  background: {
    primary: colors.white,
    secondary: colors.grey[50],
    tertiary: colors.grey[100],
  },
  border: {
    light: colors.grey[200],
    medium: colors.grey[300],
    dark: colors.grey[400],
  },
  accent: {
    info: colors.blue,
    important: colors.purple,
    success: colors.green,
    warning: colors.orange,
  }
}

