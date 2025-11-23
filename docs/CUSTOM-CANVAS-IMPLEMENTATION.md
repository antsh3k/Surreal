# 🎨 Custom Canvas Implementation Guide

### **Excalidraw-Style Creative Canvas for Surreal Mental Maps**

---

## 🎯 When to Choose Custom Canvas

**Perfect for:**
- Unique brand differentiation
- Creative/design-oriented contexts
- Memorable demo presentations
- Hand-drawn aesthetic requirements
- Teams wanting to stand out visually
- Educational/playful applications

**The Experience:** Think Excalidraw meets mind mapping - organic, hand-drawn feel that makes complex concepts feel approachable and human.

---

## 🚀 Quick Start Setup

### **1. Creative Canvas Setup**
```bash
# Create new Vite project
npm create vite surreal-custom-canvas -- --template react-ts
cd surreal-custom-canvas

# Install creative-focused dependencies
npm install rough-js fabric jotai framer-motion
npm install -D @types/fabric stitches

# Optional: Hand-drawn icons
npm install lucide-react react-icons
```

### **2. Stitches CSS-in-JS Setup (stitches.config.ts)**
```typescript
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
```

---

## 📁 Creative Architecture Structure

```
src/
├── canvas/
│   ├── CustomCanvas.tsx             # Main creative canvas
│   ├── HandDrawnNode.tsx            # Rough.js node rendering
│   ├── OrganicConnections.tsx       # Curved, hand-drawn lines
│   └── CreativeTools.tsx            # Drawing tools UI
├── components/
│   ├── interactions/
│   │   ├── SketchyGestures.tsx      # Hand-drawn gesture recognition
│   │   ├── CreativeContextMenu.tsx  # Artistic context menu
│   │   └── PenTool.tsx              # Drawing/annotation tools
│   ├── ui/
│   │   ├── HandwrittenText.tsx      # Custom text rendering
│   │   ├── SketchyButton.tsx        # Hand-drawn button style
│   │   └── ArtisticStatusBar.tsx    # Creative status indicators
├── hooks/
│   ├── useRoughCanvas.ts            # Rough.js integration
│   ├── useOrganicLayout.ts          # Natural positioning
│   ├── useCreativeAnimations.ts     # Organic animations
│   └── useDrawingTools.ts           # Pen/drawing state
├── services/
│   ├── roughRenderer.ts             # Hand-drawn rendering
│   ├── organicLayoutEngine.ts       # Natural node positioning
│   └── creativExportEngine.ts       # Export as artwork
├── stores/
│   ├── creativeCanvasStore.ts       # Artistic state management
│   └── drawingToolsStore.ts         # Drawing tools state
└── types/
    └── creative.ts                  # Creative-specific types
```

---

## 🎨 Core Creative Components

### **1. CustomCanvas.tsx - Main Artistic Container**
```tsx
import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import rough from 'roughjs/bundled/rough.esm'
import { RoughCanvas } from 'roughjs/bin/canvas'
import { useCreativeCanvasStore } from '../stores/creativeCanvasStore'
import { useRoughCanvas } from '../hooks/useRoughCanvas'
import { useOrganicLayout } from '../hooks/useOrganicLayout'
import { styled } from '../stitches.config'

const CanvasContainer = styled('div', {
  width: '100vw',
  height: '100vh',
  backgroundColor: '$paper',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'crosshair',
  
  // Paper texture overlay
  '&::before': {
    content: '',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.1"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    pointerEvents: 'none',
    opacity: 0.3,
  }
})

const CustomCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [roughCanvas, setRoughCanvas] = useState<RoughCanvas | null>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  
  const { 
    nodes, 
    connections, 
    isDrawingMode,
    selectedTool 
  } = useCreativeCanvasStore()
  
  const { drawNode, drawConnection, drawSketch } = useRoughCanvas(roughCanvas)
  const { organicPositions } = useOrganicLayout(nodes)

  // Initialize rough canvas
  useEffect(() => {
    if (canvasRef.current) {
      const rc = rough.canvas(canvasRef.current)
      setRoughCanvas(rc)
    }
  }, [])

  // Handle responsive canvas
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Render nodes with hand-drawn style
  useEffect(() => {
    if (!roughCanvas || !canvasRef.current) return
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    
    // Clear canvas with subtle paper texture
    ctx.fillStyle = '#FEFCF3'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)
    
    // Draw connections first (behind nodes)
    connections.forEach(connection => {
      const fromPos = organicPositions[connection.from]
      const toPos = organicPositions[connection.to]
      if (fromPos && toPos) {
        drawConnection(fromPos, toPos, connection.style)
      }
    })
    
    // Draw nodes with organic style
    nodes.forEach(node => {
      const position = organicPositions[node.id]
      if (position) {
        drawNode(node, position)
      }
    })
    
  }, [nodes, connections, organicPositions, roughCanvas, dimensions])

  return (
    <CanvasContainer>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      />
      
      {/* Creative UI Overlays */}
      <AnimatePresence>
        {/* Hand-drawn style UI elements */}
      </AnimatePresence>
    </CanvasContainer>
  )
}

export default CustomCanvas
```

### **2. useRoughCanvas.ts - Hand-Drawn Rendering**
```typescript
import { useCallback } from 'react'
import { RoughCanvas } from 'roughjs/bin/canvas'
import { ConceptNodeData } from '../types/creative'

export const useRoughCanvas = (roughCanvas: RoughCanvas | null) => {
  
  const drawNode = useCallback((node: ConceptNodeData, position: { x: number; y: number }) => {
    if (!roughCanvas) return
    
    const { x, y } = position
    const width = 140
    const height = 60
    
    // Node style based on preference and state
    const getNodeStyle = () => {
      if (node.preferenceScore > 0.3) {
        return {
          fill: '#A7F3D0', // Soft green
          stroke: '#059669',
          strokeWidth: 2,
          roughness: 1.2,
          fillStyle: 'hachure',
          hachureAngle: 45,
          hachureGap: 4
        }
      } else if (node.preferenceScore < -0.3) {
        return {
          fill: '#FED7AA', // Soft orange  
          stroke: '#EA580C',
          strokeWidth: 2,
          roughness: 1.5,
          fillStyle: 'zigzag',
          hachureAngle: -45,
          hachureGap: 3
        }
      } else if (node.isUncertain) {
        return {
          fill: 'white',
          stroke: '#6B7280',
          strokeWidth: 2,
          roughness: 2.0, // More hand-drawn feel
          fillStyle: 'dots',
          strokeLineDash: [5, 5],
          strokeLineDashOffset: Math.random() * 10 // Organic dash variation
        }
      }
      
      return {
        fill: 'white',
        stroke: '#2A2B2A',
        strokeWidth: 1.5,
        roughness: 1.0,
        fillStyle: 'solid'
      }
    }
    
    const style = getNodeStyle()
    
    // Draw hand-drawn rectangle for node background
    roughCanvas.rectangle(x - width/2, y - height/2, width, height, {
      ...style,
      seed: node.id.charCodeAt(0) // Consistent randomness per node
    })
    
    // Draw hand-written text (approximation)
    const canvas = roughCanvas.canvas
    const ctx = canvas.getContext('2d')!
    
    // Save context for text
    ctx.save()
    ctx.font = '16px Caveat, cursive' // Hand-written font
    ctx.fillStyle = '#2A2B2A'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add slight text rotation for organic feel
    const textRotation = (Math.random() - 0.5) * 0.1 // ±3 degrees
    ctx.translate(x, y)
    ctx.rotate(textRotation)
    
    // Multi-line text handling
    const words = node.label.split(' ')
    const lines = []
    let currentLine = words[0]
    
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i]
      const metrics = ctx.measureText(testLine)
      if (metrics.width > width - 20) {
        lines.push(currentLine)
        currentLine = words[i]
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
    
    // Draw each line with slight organic offset
    const lineHeight = 18
    const totalHeight = lines.length * lineHeight
    const startY = -totalHeight / 2 + lineHeight / 2
    
    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight
      const xOffset = (Math.random() - 0.5) * 2 // Slight handwriting wobble
      ctx.fillText(line, xOffset, lineY)
    })
    
    // Add uncertainty indicator with hand-drawn arrow
    if (node.isUncertain) {
      ctx.restore()
      ctx.save()
      
      // Draw sketchy arrow pointing to node
      roughCanvas.path(`M ${x - width/2 - 20} ${y + height/2 + 10} Q ${x - width/2 - 10} ${y + height/2 + 20} ${x - width/2} ${y + height/2}`, {
        stroke: '#6B7280',
        strokeWidth: 1.5,
        roughness: 2.5,
        seed: (node.id + 'arrow').charCodeAt(0)
      })
      
      // Handwritten "click me!"
      ctx.font = '12px Caveat, cursive'
      ctx.fillStyle = '#6B7280'
      ctx.textAlign = 'left'
      ctx.fillText('click me!', x - width/2 - 50, y + height/2 + 15)
    }
    
    // Add preference indicator with hand-drawn stars
    if (node.preferenceScore > 0.5) {
      for (let i = 0; i < 3; i++) {
        const starX = x + width/2 + 10 + i * 15
        const starY = y - height/2 - 10
        
        // Draw rough star
        roughCanvas.path(`M ${starX} ${starY-5} L ${starX+3} ${starY-1} L ${starX+7} ${starY-1} L ${starX+4} ${starY+2} L ${starX+5} ${starY+6} L ${starX} ${starY+3} L ${starX-5} ${starY+6} L ${starX-4} ${starY+2} L ${starX-7} ${starY-1} L ${starX-3} ${starY-1} Z`, {
          fill: '#FEF08A',
          stroke: '#F59E0B',
          strokeWidth: 1,
          roughness: 1.8,
          seed: (node.id + 'star' + i).charCodeAt(0)
        })
      }
    }
    
    ctx.restore()
    
  }, [roughCanvas])
  
  const drawConnection = useCallback((
    from: { x: number; y: number }, 
    to: { x: number; y: number },
    style: any = {}
  ) => {
    if (!roughCanvas) return
    
    // Create organic, hand-drawn connection
    const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 20
    const midY = (from.y + to.y) / 2 + (Math.random() - 0.5) * 20
    
    // Curved path for organic feel
    const pathData = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`
    
    roughCanvas.path(pathData, {
      stroke: style.color || '#9CA3AF',
      strokeWidth: style.width || 2,
      roughness: 1.5,
      fill: 'none',
      seed: (from.x + from.y + to.x + to.y) % 100 // Consistent randomness
    })
    
  }, [roughCanvas])
  
  const drawSketch = useCallback((points: { x: number; y: number }[], style: any = {}) => {
    if (!roughCanvas || points.length < 2) return
    
    // Convert points to path
    const pathData = points.reduce((path, point, index) => {
      return index === 0 
        ? `M ${point.x} ${point.y}` 
        : `${path} L ${point.x} ${point.y}`
    }, '')
    
    roughCanvas.path(pathData, {
      stroke: style.color || '#6B7280',
      strokeWidth: style.width || 2,
      roughness: 2.0,
      fill: 'none'
    })
    
  }, [roughCanvas])
  
  return {
    drawNode,
    drawConnection,
    drawSketch
  }
}
```

### **3. CreativeContextMenu.tsx - Artistic Menu Design**
```tsx
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { styled } from '../stitches.config'
import { Palette, Image, Video, FileText, Trash2, Star } from 'lucide-react'

const MenuContainer = styled(motion.div, {
  position: 'fixed',
  backgroundColor: '$paper',
  border: '2px solid $ink',
  borderRadius: '$3',
  padding: '$2',
  zIndex: 1000,
  boxShadow: '4px 4px 0px $colors$ink',
  
  // Hand-drawn border effect
  '&::before': {
    content: '',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: '$3',
    background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
    zIndex: -1,
  }
})

const MenuItem = styled('button', {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  width: '100%',
  padding: '$2',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '$2',
  fontFamily: '$handwritten',
  fontSize: '$3',
  color: '$ink',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  '&:hover': {
    backgroundColor: '$highlight',
    transform: 'rotate(-1deg) scale(1.02)',
  },
  
  '&:active': {
    transform: 'rotate(1deg) scale(0.98)',
  }
})

interface CreativeContextMenuProps {
  nodeId: string
  position: { x: number; y: number }
  onClose: () => void
  onAction: (nodeId: string, action: string) => void
}

const CreativeContextMenu = ({ 
  nodeId, 
  position, 
  onClose, 
  onAction 
}: CreativeContextMenuProps) => {
  
  const menuItems = [
    { icon: Palette, label: 'Color this idea', action: 'color' },
    { icon: Image, label: 'Sketch a diagram', action: 'generate-image' },
    { icon: Video, label: 'Find a video', action: 'find-video' },
    { icon: FileText, label: 'Write summary', action: 'summarize' },
    { icon: Star, label: 'Mark as favorite', action: 'favorite' },
    { icon: Trash2, label: 'Remove branch', action: 'delete' }
  ]
  
  return (
    <AnimatePresence>
      <MenuContainer
        initial={{ 
          scale: 0.8, 
          opacity: 0, 
          rotate: -5,
          x: position.x,
          y: position.y
        }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          rotate: Math.random() * 4 - 2, // Random slight rotation
        }}
        exit={{ 
          scale: 0.8, 
          opacity: 0, 
          rotate: 5 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }}
        style={{
          left: position.x,
          top: position.y,
          transformOrigin: 'top left'
        }}
      >
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.action}
            onClick={() => {
              onAction(nodeId, item.action)
              onClose()
            }}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <item.icon size={18} />
            {item.label}
          </MenuItem>
        ))}
      </MenuContainer>
      
      {/* Backdrop */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
    </AnimatePresence>
  )
}

export default CreativeContextMenu
```

---

## 🌟 Organic Animations & Interactions

### **1. useCreativeAnimations.ts - Natural Movement**
```typescript
import { useCallback } from 'react'
import { useSpring, animated } from '@react-spring/web'

export const useCreativeAnimations = () => {
  
  const createOrganicAppearance = useCallback((delay = 0) => {
    return useSpring({
      from: { 
        scale: 0.3, 
        opacity: 0, 
        rotate: Math.random() * 40 - 20 // Random rotation
      },
      to: { 
        scale: 1, 
        opacity: 1, 
        rotate: (Math.random() - 0.5) * 6 // Slight final rotation
      },
      delay,
      config: {
        tension: 200,
        friction: 15,
        mass: 0.8
      }
    })
  }, [])
  
  const createFloatingAnimation = useCallback((nodeId: string) => {
    // Create unique floating pattern based on node ID
    const seed = nodeId.charCodeAt(0)
    const amplitude = 3 + (seed % 4)
    const frequency = 0.8 + (seed % 3) * 0.2
    
    return useSpring({
      from: { y: 0 },
      to: async (next) => {
        while (true) {
          await next({ 
            y: amplitude,
            config: { duration: 2000 + (seed % 1000), tension: 120, friction: 14 }
          })
          await next({ 
            y: -amplitude,
            config: { duration: 2000 + (seed % 1000), tension: 120, friction: 14 }
          })
        }
      },
      delay: (seed % 2000), // Stagger animations
    })
  }, [])
  
  const createHandDrawnLine = useCallback((from: Point, to: Point) => {
    // Generate organic curve with slight randomness
    const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 30
    const midY = (from.y + to.y) / 2 + (Math.random() - 0.5) * 30
    
    return useSpring({
      from: { pathLength: 0 },
      to: { pathLength: 1 },
      config: { 
        duration: 1000, 
        easing: (t) => t * t * (3 - 2 * t) // Ease in-out
      }
    })
  }, [])
  
  const createPreferenceGlow = useCallback((preferenceScore: number) => {
    if (preferenceScore > 0.3) {
      return useSpring({
        from: { 
          filter: 'drop-shadow(0 0 0px rgba(16, 185, 129, 0))' 
        },
        to: async (next) => {
          while (true) {
            await next({ 
              filter: `drop-shadow(0 0 ${8 + preferenceScore * 10}px rgba(16, 185, 129, 0.4))`,
              config: { duration: 2000 }
            })
            await next({ 
              filter: `drop-shadow(0 0 ${4 + preferenceScore * 5}px rgba(16, 185, 129, 0.2))`,
              config: { duration: 2000 }
            })
          }
        }
      })
    }
    
    return useSpring({ filter: 'none' })
  }, [])
  
  return {
    createOrganicAppearance,
    createFloatingAnimation,
    createHandDrawnLine,
    createPreferenceGlow
  }
}
```

### **2. useOrganicLayout.ts - Natural Positioning**
```typescript
import { useState, useEffect, useMemo } from 'react'
import { ConceptNodeData } from '../types/creative'

export const useOrganicLayout = (nodes: ConceptNodeData[]) => {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  
  // Organic clustering algorithm
  const calculateOrganicPositions = useMemo(() => (nodes: ConceptNodeData[]) => {
    const newPositions: Record<string, { x: number; y: number }> = {}
    
    if (nodes.length === 0) return newPositions
    
    // Find root node (topic center)
    const rootNode = nodes.find(n => !n.id.includes('-child-')) || nodes[0]
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    // Place root in center with slight organic offset
    newPositions[rootNode.id] = {
      x: centerX + (Math.random() - 0.5) * 20,
      y: centerY + (Math.random() - 0.5) * 20
    }
    
    // Group nodes by generation
    const generations = new Map<number, ConceptNodeData[]>()
    nodes.forEach(node => {
      const generation = node.id.split('-child-').length - 1
      if (!generations.has(generation)) {
        generations.set(generation, [])
      }
      generations.get(generation)!.push(node)
    })
    
    // Position each generation organically
    Array.from(generations.entries()).forEach(([gen, genNodes]) => {
      if (gen === 0) return // Root already positioned
      
      const radius = 120 + gen * 100 // Increasing radius per generation
      const angleStep = (Math.PI * 2) / genNodes.length
      
      genNodes.forEach((node, index) => {
        // Base angle with organic variation
        const baseAngle = index * angleStep + (Math.random() - 0.5) * 0.5
        const organicRadius = radius + (Math.random() - 0.5) * 40
        
        // Create clusters around parent nodes when possible
        const parentId = node.id.split('-child-').slice(0, -1).join('-child-')
        const parentPos = newPositions[parentId]
        
        if (parentPos && gen > 1) {
          // Position relative to parent with organic spread
          const parentAngle = Math.atan2(
            parentPos.y - centerY, 
            parentPos.x - centerX
          )
          const spreadAngle = parentAngle + (Math.random() - 0.5) * Math.PI * 0.8
          const spreadDistance = 80 + Math.random() * 60
          
          newPositions[node.id] = {
            x: parentPos.x + Math.cos(spreadAngle) * spreadDistance,
            y: parentPos.y + Math.sin(spreadAngle) * spreadDistance
          }
        } else {
          // Radial positioning with organic variation
          newPositions[node.id] = {
            x: centerX + Math.cos(baseAngle) * organicRadius,
            y: centerY + Math.sin(baseAngle) * organicRadius
          }
        }
      })
    })
    
    // Apply force simulation for organic spacing
    for (let iteration = 0; iteration < 30; iteration++) {
      Object.keys(newPositions).forEach(nodeId => {
        const pos = newPositions[nodeId]
        let fx = 0, fy = 0
        
        // Repulsion from other nodes
        Object.keys(newPositions).forEach(otherId => {
          if (nodeId === otherId) return
          
          const otherPos = newPositions[otherId]
          const dx = pos.x - otherPos.x
          const dy = pos.y - otherPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 100 && distance > 0) {
            const force = (100 - distance) / distance * 0.5
            fx += dx * force
            fy += dy * force
          }
        })
        
        // Apply force with damping
        newPositions[nodeId] = {
          x: pos.x + fx * 0.1,
          y: pos.y + fy * 0.1
        }
      })
    }
    
    return newPositions
  }, [])
  
  // Update positions when nodes change
  useEffect(() => {
    const newPositions = calculateOrganicPositions(nodes)
    setPositions(newPositions)
  }, [nodes, calculateOrganicPositions])
  
  // Animated position transitions
  const animateToNewLayout = (newNodes: ConceptNodeData[]) => {
    const newPositions = calculateOrganicPositions(newNodes)
    
    // Smooth transition using RAF
    const startPositions = { ...positions }
    const startTime = performance.now()
    const duration = 800
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for organic feel
      const easedProgress = progress * progress * (3 - 2 * progress)
      
      const interpolatedPositions: Record<string, { x: number; y: number }> = {}
      
      Object.keys(newPositions).forEach(nodeId => {
        const start = startPositions[nodeId] || newPositions[nodeId]
        const end = newPositions[nodeId]
        
        interpolatedPositions[nodeId] = {
          x: start.x + (end.x - start.x) * easedProgress,
          y: start.y + (end.y - start.y) * easedProgress
        }
      })
      
      setPositions(interpolatedPositions)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }
  
  return {
    organicPositions: positions,
    animateToNewLayout
  }
}
```

---

## 📱 Mobile & Accessibility for Creative Canvas

### **1. Touch Gesture Recognition**
```typescript
// hooks/useCreativeGestures.ts
export const useCreativeGestures = (canvasRef: RefObject<HTMLCanvasElement>) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
    
    setIsDrawing(true)
    setCurrentStroke([point])
  }, [])
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    
    const touch = e.touches[0]
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
    
    setCurrentStroke(prev => [...prev, point])
  }, [isDrawing])
  
  return {
    handleTouchStart,
    handleTouchMove,
    currentStroke,
    isDrawing
  }
}
```

### **2. Accessibility for Canvas Content**
```tsx
// components/AccessibleCanvasDescription.tsx
const AccessibleCanvasDescription = ({ nodes }: { nodes: ConceptNodeData[] }) => {
  return (
    <div 
      className="sr-only" 
      aria-live="polite"
      aria-label="Mental map content"
    >
      <h2>Mental Map: {nodes.length} concepts</h2>
      {nodes.map(node => (
        <div key={node.id}>
          Concept: {node.label}. 
          {node.isUncertain ? 'Click to explore. ' : 'Fully explored. '}
          Preference: {node.preferenceScore > 0.3 ? 'Highly relevant' : 'Unknown relevance'}.
        </div>
      ))}
    </div>
  )
}
```

---

## 🎯 When to Choose Custom Canvas

### **Perfect For:**
- 🎨 **Brand Differentiation**: Stand out from typical corporate tools
- 🎪 **Demo Presentations**: Memorable, engaging demos
- 🎓 **Educational Context**: Makes learning feel playful
- 🎨 **Creative Industries**: Design, art, creative agencies
- 🎯 **Unique Requirements**: When standard UIs won't do

### **Development Investment:**
- **Time**: 3-5x longer than React Flow
- **Complexity**: Requires canvas expertise
- **Maintenance**: Custom interactions need ongoing support
- **Testing**: More complex testing scenarios

### **User Experience Benefits:**
- ✅ **Memorable**: Users remember the experience
- ✅ **Approachable**: Hand-drawn feel reduces intimidation
- ✅ **Delightful**: Unexpected interactions create joy
- ✅ **Human**: Feels personal and organic, not mechanical

**This Custom Canvas implementation creates a truly unique experience that users will remember long after the demo ends. Perfect for making Surreal stand out in a crowded field of productivity tools.**

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Create TECH-STACK-COMPARISON.md with detailed analysis of 4 options", "status": "completed"}, {"id": "2", "content": "Create REACT-FLOW-IMPLEMENTATION.md (primary recommendation)", "status": "completed"}, {"id": "3", "content": "Create KONVA-CANVAS-IMPLEMENTATION.md (performance alternative)", "status": "completed"}, {"id": "4", "content": "Create PURE-REACT-IMPLEMENTATION.md (lightweight approach)", "status": "completed"}, {"id": "5", "content": "Create CUSTOM-CANVAS-IMPLEMENTATION.md (creative approach)", "status": "completed"}]