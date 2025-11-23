// Layout Configuration for Initial Node Positioning
// Change the CURRENT_LAYOUT to test different options

export type LayoutOption = 'compass' | 'diamond' | 'asymmetric' | 'progressive'

export const LAYOUT_OPTIONS = {
  compass: {
    name: 'Classic Compass Layout',
    description: 'Nodes positioned at cardinal directions (N, E, S, W)',
    radius: 300,
    benefits: 'Clean, predictable, symmetric'
  },
  diamond: {
    name: 'Diamond Layout', 
    description: 'Nodes positioned at diagonal directions (NE, SE, SW, NW)',
    radius: 280,
    benefits: 'Dynamic, avoids horizontal/vertical clustering'
  },
  asymmetric: {
    name: 'Asymmetric Balanced Layout',
    description: 'Cardinal directions with 15° offset for better text readability',
    radius: 320,
    benefits: 'Prevents overlapping text, optimized spacing'
  },
  progressive: {
    name: 'Progressive Distance Layout',
    description: 'Cardinal directions with adaptive radius based on content length',
    radius: 'variable (280-340px)',
    benefits: 'Longer concept names get more space'
  }
} as const

// 🔧 CHANGE THIS TO TEST DIFFERENT LAYOUTS:
export const CURRENT_LAYOUT: LayoutOption = 'compass'

// Quick reference for angles (in degrees for human readability):
// compass: Top(0°), Right(90°), Bottom(180°), Left(270°)  
// diamond: NE(45°), SE(135°), SW(225°), NW(315°)
// asymmetric: 15° offset from compass angles
// progressive: Same as compass but with adaptive radius