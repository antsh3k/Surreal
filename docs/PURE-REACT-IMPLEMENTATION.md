# 🎯 Pure React + SVG Implementation Guide

### **Lightweight, Customizable Implementation for Surreal Mental Maps**

---

## 🎯 When to Choose Pure React + SVG

**Perfect for:**
- Complete customization control
- Educational/learning projects  
- Lightweight bundle requirements (<200KB)
- SEO-friendly applications
- Accessibility-first implementations
- Teams wanting to understand the fundamentals

**Best Performance:** 20-30 nodes with smooth interactions

---

## 🚀 Quick Start Setup

### **1. Minimal Project Setup**
```bash
# Create new Vite project
npm create vite surreal-pure-react -- --template react-ts
cd surreal-pure-react

# Minimal dependencies - only what we need
npm install framer-motion tailwindcss clsx
npm install -D @tailwindcss/typography autoprefixer postcss

# Setup Tailwind
npx tailwindcss init -p
```

### **2. Tailwind Configuration (tailwind.config.js)**
```javascript
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
```

---

## 📁 Clean Architecture Structure

```
src/
├── components/
│   ├── mental-map/
│   │   ├── MentalMapSVG.tsx          # Main SVG container
│   │   ├── ConceptNode.tsx           # Individual node component
│   │   ├── ConnectionLine.tsx        # Edge connections  
│   │   └── ViewportControls.tsx      # Zoom/pan controls
│   ├── interactions/
│   │   ├── NodeClickHandler.tsx      # Click interaction logic
│   │   ├── ContextMenu.tsx           # Right-click menu
│   │   └── TouchGestureHandler.tsx   # Mobile touch handling
│   └── ui/
│       ├── TopicInput.tsx            # Topic entry
│       ├── PreferenceIndicator.tsx   # Learning visualization  
│       └── ExportControls.tsx        # Save/export features
├── hooks/
│   ├── useLayout.ts                  # Node positioning algorithms
│   ├── usePreferences.ts             # Preference learning logic
│   ├── useViewport.ts                # Zoom/pan state management
│   └── useResponsive.ts              # Mobile adaptation
├── services/
│   ├── layoutEngine.ts               # Node positioning algorithms
│   ├── preferenceEngine.ts           # Learning algorithm
│   └── exportService.ts              # SVG export functionality
├── stores/
│   ├── mentalMapState.ts             # Simple state with useReducer
│   └── preferencesState.ts           # User learning state
├── types/
│   └── index.ts                      # TypeScript definitions
└── utils/
    ├── nodePositioning.ts            # Layout calculations
    ├── svgHelpers.ts                 # SVG utility functions
    └── geometryUtils.ts              # Mathematical helpers
```

---

## 🎨 Core Components

### **1. MentalMapSVG.tsx - Main Container**
```tsx
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMentalMapState } from '../stores/mentalMapState'
import { useViewport } from '../hooks/useViewport'
import { useLayout } from '../hooks/useLayout'
import ConceptNode from './ConceptNode'
import ConnectionLine from './ConnectionLine'
import ContextMenu from '../interactions/ContextMenu'

const MentalMapSVG = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const { nodes, connections, contextMenu } = useMentalMapState()
  const { viewBox, zoom, pan, handleWheel, handlePan } = useViewport()
  const { positions } = useLayout(nodes)

  const [dimensions] = useState({ width: 1200, height: 800 })

  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden relative">
      <motion.svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handlePan}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background pattern */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connection lines layer */}
        <g className="connections">
          <AnimatePresence>
            {connections.map(connection => (
              <ConnectionLine
                key={`${connection.from}-${connection.to}`}
                connection={connection}
                fromPosition={positions[connection.from]}
                toPosition={positions[connection.to]}
              />
            ))}
          </AnimatePresence>
        </g>

        {/* Nodes layer */}
        <g className="nodes">
          <AnimatePresence>
            {nodes.map(node => (
              <ConceptNode
                key={node.id}
                node={node}
                position={positions[node.id]}
              />
            ))}
          </AnimatePresence>
        </g>
      </motion.svg>

      {/* UI Overlays */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            nodeId={contextMenu.nodeId}
            position={contextMenu.position}
            onClose={() => useMentalMapState.getState().closeContextMenu()}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default MentalMapSVG
```

### **2. ConceptNode.tsx - SVG Node Component**
```tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMentalMapState } from '../stores/mentalMapState'
import { usePreferences } from '../hooks/usePreferences'
import clsx from 'clsx'

interface ConceptNodeProps {
  node: ConceptNodeData
  position: { x: number; y: number }
}

const ConceptNode = ({ node, position }: ConceptNodeProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const { expandNode, openContextMenu } = useMentalMapState()
  const { updatePreference } = usePreferences()

  const handleClick = () => {
    if (node.isUncertain) {
      expandNode(node.id)
      updatePreference(node.id, 'clicked')
    }
  }

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    openContextMenu(node.id, { x: e.clientX, y: e.clientY })
  }

  const getNodeStyles = () => {
    if (node.preferenceScore > 0.3) {
      return {
        fill: '#F0FDF4',
        stroke: '#10B981',
        strokeWidth: 2,
        className: 'text-green-600'
      }
    } else if (node.preferenceScore < -0.3) {
      return {
        fill: '#FEF3C7',
        stroke: '#F59E0B',
        strokeWidth: 2,
        className: 'text-orange-600'
      }
    } else if (node.isUncertain) {
      return {
        fill: '#FFFFFF',
        stroke: '#9CA3AF',
        strokeWidth: 2,
        strokeDasharray: '5,5',
        className: 'text-gray-500'
      }
    }
    
    return {
      fill: '#FFFFFF',
      stroke: '#E5E5E5',
      strokeWidth: 1,
      className: 'text-gray-900'
    }
  }

  const styles = getNodeStyles()
  const nodeWidth = 140
  const nodeHeight = 50

  return (
    <motion.g
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      transform={`translate(${position.x - nodeWidth/2}, ${position.y - nodeHeight/2})`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      {/* Node background with preference glow */}
      <motion.rect
        width={nodeWidth}
        height={nodeHeight}
        rx="8"
        ry="8"
        fill={styles.fill}
        stroke={styles.stroke}
        strokeWidth={styles.strokeWidth}
        strokeDasharray={styles.strokeDasharray}
        animate={{
          filter: node.preferenceScore > 0.5 && isHovered 
            ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' 
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Node text */}
      <text
        x={nodeWidth / 2}
        y={nodeHeight / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className={clsx(
          'text-sm font-medium pointer-events-none',
          styles.className
        )}
        fill="currentColor"
      >
        <tspan x={nodeWidth / 2} dy="0">
          {node.label.length > 18 
            ? `${node.label.slice(0, 15)}...` 
            : node.label
          }
        </tspan>
        
        {/* Uncertain indicator */}
        {node.isUncertain && (
          <tspan x={nodeWidth / 2} dy="12" className="text-xs opacity-70">
            Click to explore
          </tspan>
        )}
        
        {/* Preference indicator */}
        {node.preferenceScore > 0.5 && (
          <tspan x={nodeWidth / 2} dy="12" className="text-xs">
            ✨ Likely interesting
          </tspan>
        )}
      </text>

      {/* Loading indicator */}
      {node.isLoading && (
        <motion.circle
          cx={nodeWidth - 15}
          cy={15}
          r="8"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="15 5"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.g>
  )
}

export default ConceptNode
```

### **3. useLayout.ts - Manual Layout Algorithm**
```typescript
import { useState, useEffect, useMemo } from 'react'
import { ConceptNodeData } from '../types'

interface Position {
  x: number
  y: number
}

export const useLayout = (nodes: ConceptNodeData[]) => {
  const [positions, setPositions] = useState<Record<string, Position>>({})

  // Simple radial layout algorithm
  const calculateRadialLayout = useMemo(() => (nodes: ConceptNodeData[]) => {
    const newPositions: Record<string, Position> = {}
    const centerX = 600
    const centerY = 400
    const radius = 200

    // Group nodes by hierarchy level
    const nodesByLevel = nodes.reduce((acc, node) => {
      const level = node.id.split('-').length - 1
      if (!acc[level]) acc[level] = []
      acc[level].push(node)
      return acc
    }, {} as Record<number, ConceptNodeData[]>)

    Object.entries(nodesByLevel).forEach(([level, levelNodes]) => {
      const levelNum = parseInt(level)
      const levelRadius = radius + (levelNum * 150)
      
      levelNodes.forEach((node, index) => {
        if (levelNum === 0) {
          // Center node
          newPositions[node.id] = { x: centerX, y: centerY }
        } else {
          // Radial positioning
          const angle = (index / levelNodes.length) * 2 * Math.PI
          newPositions[node.id] = {
            x: centerX + Math.cos(angle) * levelRadius,
            y: centerY + Math.sin(angle) * levelRadius
          }
        }
      })
    })

    return newPositions
  }, [])

  // Tree layout algorithm  
  const calculateTreeLayout = useMemo(() => (nodes: ConceptNodeData[]) => {
    const newPositions: Record<string, Position> = {}
    const nodeWidth = 140
    const nodeHeight = 50
    const horizontalSpacing = 180
    const verticalSpacing = 100

    // Build tree structure
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const children = new Map<string, string[]>()
    let root: ConceptNodeData | null = null

    nodes.forEach(node => {
      const parts = node.id.split('-')
      if (parts.length === 1) {
        root = node
      } else {
        const parentId = parts.slice(0, -2).join('-') || parts[0]
        if (!children.has(parentId)) children.set(parentId, [])
        children.get(parentId)?.push(node.id)
      }
    })

    if (!root) return newPositions

    // Position nodes using depth-first traversal
    const positionNode = (
      nodeId: string, 
      x: number, 
      y: number, 
      subtreeWidth: number
    ) => {
      newPositions[nodeId] = { x, y }
      
      const nodeChildren = children.get(nodeId) || []
      if (nodeChildren.length === 0) return

      const childWidth = subtreeWidth / nodeChildren.length
      let currentX = x - subtreeWidth / 2 + childWidth / 2

      nodeChildren.forEach(childId => {
        positionNode(childId, currentX, y + verticalSpacing, childWidth * 0.8)
        currentX += childWidth
      })
    }

    // Calculate total width needed
    const calculateSubtreeWidth = (nodeId: string): number => {
      const nodeChildren = children.get(nodeId) || []
      if (nodeChildren.length === 0) return nodeWidth

      const childWidths = nodeChildren.map(calculateSubtreeWidth)
      return Math.max(
        childWidths.reduce((sum, w) => sum + w, 0) + horizontalSpacing * (nodeChildren.length - 1),
        nodeWidth
      )
    }

    const totalWidth = calculateSubtreeWidth(root.id)
    positionNode(root.id, 600, 100, totalWidth)

    return newPositions
  }, [])

  // Force-directed layout (simplified)
  const calculateForceLayout = useMemo(() => (nodes: ConceptNodeData[]) => {
    const newPositions: Record<string, Position> = {}
    
    // Initialize random positions
    nodes.forEach(node => {
      newPositions[node.id] = {
        x: Math.random() * 1000 + 200,
        y: Math.random() * 600 + 200
      }
    })

    // Simple force simulation
    for (let i = 0; i < 50; i++) {
      // Repulsion between nodes
      nodes.forEach(nodeA => {
        nodes.forEach(nodeB => {
          if (nodeA.id === nodeB.id) return
          
          const dx = newPositions[nodeA.id].x - newPositions[nodeB.id].x
          const dy = newPositions[nodeA.id].y - newPositions[nodeB.id].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 200) {
            const force = (200 - distance) / 200 * 2
            newPositions[nodeA.id].x += (dx / distance) * force
            newPositions[nodeA.id].y += (dy / distance) * force
          }
        })
      })
    }

    return newPositions
  }, [])

  // Update positions when nodes change
  useEffect(() => {
    if (nodes.length === 0) return

    // Choose layout algorithm based on node structure
    let newPositions: Record<string, Position>
    
    if (nodes.length <= 8) {
      newPositions = calculateRadialLayout(nodes)
    } else {
      newPositions = calculateTreeLayout(nodes)
    }

    setPositions(newPositions)
  }, [nodes, calculateRadialLayout, calculateTreeLayout])

  // Animation helpers
  const animateToNewPositions = (newPos: Record<string, Position>) => {
    // Smooth transition to new positions
    // This would integrate with Framer Motion for smooth animations
    setPositions(newPos)
  }

  return {
    positions,
    animateToNewPositions,
    layouts: {
      radial: calculateRadialLayout,
      tree: calculateTreeLayout,
      force: calculateForceLayout
    }
  }
}
```

---

## 📱 Mobile & Accessibility Optimization

### **1. useResponsive.ts - Mobile Adaptation**
```typescript
import { useState, useEffect } from 'react'

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [touchCapable, setTouchCapable] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      setTouchCapable('ontouchstart' in window)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const getNodeSize = () => {
    if (isMobile) return { width: 120, height: 45 }
    if (isTablet) return { width: 130, height: 48 }
    return { width: 140, height: 50 }
  }

  const getTouchTargetSize = () => {
    return touchCapable ? 44 : 0 // 44px minimum for touch
  }

  return {
    isMobile,
    isTablet,
    touchCapable,
    getNodeSize,
    getTouchTargetSize
  }
}
```

### **2. Accessibility Features**
```tsx
// AccessibleNode.tsx - Screen reader support
const AccessibleConceptNode = ({ node, position }: ConceptNodeProps) => {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Concept: ${node.label}. ${
        node.isUncertain ? 'Click to explore' : 'Fully explored'
      }. Relevance score: ${node.preferenceScore > 0 ? 'High' : 'Unknown'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
      // ... rest of component
    >
      {/* Visual elements */}
    </g>
  )
}
```

---

## 📤 Export & Integration

### **1. SVG Export Service**
```typescript
// services/exportService.ts
export class SVGExportService {
  static exportToSVG(svgElement: SVGSVGElement): string {
    // Clone the SVG to avoid modifying original
    const clonedSVG = svgElement.cloneNode(true) as SVGSVGElement
    
    // Add necessary styles inline
    const styleElement = document.createElement('style')
    styleElement.textContent = `
      .concept-node { font-family: Inter, system-ui, sans-serif; }
      .preference-liked { stroke: #10B981; fill: #F0FDF4; }
      .preference-uncertain { stroke: #F59E0B; fill: #FEF3C7; }
    `
    clonedSVG.insertBefore(styleElement, clonedSVG.firstChild)
    
    // Serialize to string
    const serializer = new XMLSerializer()
    return serializer.serializeToString(clonedSVG)
  }

  static exportToPNG(svgElement: SVGSVGElement, scale = 2): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      const svgData = this.exportToSVG(svgElement)
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    })
  }

  static exportToJSON(nodes: ConceptNodeData[], connections: any[]): string {
    const exportData = {
      version: '1.0',
      format: 'surreal-mental-map',
      timestamp: new Date().toISOString(),
      data: { nodes, connections },
      metadata: {
        nodeCount: nodes.length,
        connectionCount: connections.length,
        exportedFrom: 'Pure React Implementation'
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  }
}
```

---

## ⚡ Performance Optimizations

### **1. React.memo and useMemo Usage**
```tsx
// Optimized components
const ConceptNode = React.memo(({ node, position }: ConceptNodeProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-renders
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.preferenceScore === nextProps.node.preferenceScore &&
    prevProps.node.isUncertain === nextProps.node.isUncertain &&
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y
  )
})

const ConnectionLine = React.memo(({ connection, fromPosition, toPosition }: ConnectionProps) => {
  // Only re-render if positions actually changed
  return (
    <motion.path
      d={`M ${fromPosition.x} ${fromPosition.y} L ${toPosition.x} ${toPosition.y}`}
      stroke="#E5E5E5"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  )
})
```

### **2. Virtual Scrolling for Large Graphs**
```typescript
// hooks/useVirtualization.ts
export const useVirtualization = (allNodes: ConceptNodeData[], viewBox: ViewBox) => {
  const visibleNodes = useMemo(() => {
    // Only render nodes within viewport + margin
    const margin = 100
    return allNodes.filter(node => {
      const pos = positions[node.id]
      if (!pos) return false
      
      return (
        pos.x + 140 >= viewBox.x - margin &&
        pos.x <= viewBox.x + viewBox.width + margin &&
        pos.y + 50 >= viewBox.y - margin &&
        pos.y <= viewBox.y + viewBox.height + margin
      )
    })
  }, [allNodes, viewBox, positions])

  return { visibleNodes }
}
```

---

## 🎯 When to Choose Pure React + SVG

### **Advantages**
- ✅ **Smallest bundle size** (~100KB vs 400KB+)
- ✅ **Complete customization control**
- ✅ **Excellent accessibility** (SVG + semantic HTML)
- ✅ **SEO-friendly** (SVG content is indexable)
- ✅ **CSS-friendly styling** (familiar tools)
- ✅ **Great for learning** (understand fundamentals)
- ✅ **No vendor lock-in** (pure web standards)

### **Trade-offs**
- ❌ **More manual work required** (layout algorithms, interactions)
- ❌ **Performance limits** (30-50 nodes max for smooth experience)
- ❌ **Longer development time** (build everything from scratch)
- ❌ **Need to implement pan/zoom manually**

### **Perfect For**
- Educational projects wanting to understand the internals
- Applications requiring unique design requirements
- Teams prioritizing bundle size and performance
- SEO-sensitive applications
- Projects with strong accessibility requirements

**This Pure React implementation provides maximum learning value and customization control while maintaining clean, understandable code architecture.**