# ⚡ Konva Canvas Implementation Guide

### **High-Performance Canvas Implementation for Surreal Mental Maps**

---

## 🎯 When to Choose Konva Canvas

**Perfect for:**
- 50+ nodes with smooth performance
- Complex custom animations
- Unique visual requirements
- Export to image functionality
- Mobile performance optimization

**Performance Targets:**
- 100+ nodes at 60fps
- Sub-100ms interaction response
- Smooth zoom/pan even on mobile
- Complex visual effects without lag

---

## 🚀 Quick Start Setup

### **1. Project Setup**
```bash
# Create new Vite project
npm create vite surreal-konva -- --template react-ts
cd surreal-konva

# Install dependencies
npm install konva react-konva framer-motion zustand tailwindcss
npm install -D @types/konva @tailwindcss/typography

# Setup Tailwind
npx tailwindcss init -p
```

### **2. Konva Integration Setup**
```typescript
// src/types/konva.d.ts
declare module 'konva/lib/Node' {
  interface Node {
    conceptData?: ConceptNodeData
  }
}

interface ConceptNodeData {
  id: string
  label: string
  isUncertain: boolean
  preferenceScore: number
  concept: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}
```

---

## 📁 Canvas-Optimized Structure

```
src/
├── components/
│   ├── canvas/
│   │   ├── KonvaStage.tsx           # Main canvas wrapper
│   │   ├── ConceptNodeCanvas.tsx    # Canvas node rendering
│   │   ├── ConnectionLayer.tsx      # Edge rendering
│   │   └── InteractionLayer.tsx     # Touch/mouse handling
│   ├── ui/
│   │   ├── CanvasControls.tsx       # Zoom/pan controls
│   │   ├── ContextMenu.tsx          # Overlay UI elements
│   │   └── PerformanceMonitor.tsx   # FPS/performance display
├── hooks/
│   ├── useCanvasInteractions.ts     # Mouse/touch handling
│   ├── useCanvasAnimations.ts       # Konva animations
│   └── usePerformanceOptimization.ts
├── services/
│   ├── canvasRenderer.ts            # Rendering optimizations
│   ├── layoutEngine.ts              # Node positioning
│   └── exportEngine.ts              # Canvas to image export
├── stores/
│   ├── canvasStore.ts               # Canvas-specific state
│   └── performanceStore.ts          # Performance monitoring
└── App.tsx
```

---

## 🎨 Core Canvas Components

### **1. KonvaStage.tsx - Main Canvas Container**
```tsx
import { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Group } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import Konva from 'konva'
import { useCanvasStore } from '../stores/canvasStore'
import { useCanvasInteractions } from '../hooks/useCanvasInteractions'
import ConceptNodeCanvas from './ConceptNodeCanvas'
import ConnectionLayer from './ConnectionLayer'

const KonvaStage = () => {
  const stageRef = useRef<Konva.Stage>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  
  const { 
    nodes, 
    connections, 
    scale, 
    position,
    selectedNodeId,
    setScale,
    setPosition,
    setSelectedNode
  } = useCanvasStore()
  
  const {
    handleNodeClick,
    handleNodeRightClick,
    handleStageClick,
    handleWheel,
    handleDrag
  } = useCanvasInteractions(stageRef)

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Performance optimization: limit render frequency
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.batchDraw()
    }
  }, [nodes, connections])

  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onDragEnd={handleDrag}
        onClick={handleStageClick}
        draggable
      >
        {/* Connection layer (behind nodes) */}
        <Layer>
          <ConnectionLayer connections={connections} />
        </Layer>
        
        {/* Node layer */}
        <Layer>
          <Group>
            {nodes.map(node => (
              <ConceptNodeCanvas
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={handleNodeClick}
                onRightClick={handleNodeRightClick}
              />
            ))}
          </Group>
        </Layer>
        
        {/* UI overlay layer */}
        <Layer listening={false}>
          {/* Performance indicators, etc. */}
        </Layer>
      </Stage>
    </div>
  )
}

export default KonvaStage
```

### **2. ConceptNodeCanvas.tsx - High-Performance Node Rendering**
```tsx
import { useRef, useEffect, useState } from 'react'
import { Group, Rect, Text } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import Konva from 'konva'
import { ConceptNodeData } from '../types'
import { useCanvasAnimations } from '../hooks/useCanvasAnimations'

interface ConceptNodeCanvasProps {
  node: ConceptNodeData
  isSelected: boolean
  onClick: (nodeId: string, event: KonvaEventObject<MouseEvent>) => void
  onRightClick: (nodeId: string, event: KonvaEventObject<MouseEvent>) => void
}

const ConceptNodeCanvas = ({ 
  node, 
  isSelected, 
  onClick, 
  onRightClick 
}: ConceptNodeCanvasProps) => {
  const groupRef = useRef<Konva.Group>(null)
  const rectRef = useRef<Konva.Rect>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const { animateNodeAppearance, animatePreferenceChange } = useCanvasAnimations()

  // Node appearance based on state
  const getNodeStyle = () => {
    const baseStyle = {
      width: node.size.width,
      height: node.size.height,
      cornerRadius: 8,
      shadowBlur: isSelected ? 8 : 4,
      shadowOpacity: isSelected ? 0.3 : 0.1,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    }

    if (node.preferenceScore > 0.3) {
      return {
        ...baseStyle,
        fill: '#F0FDF4',
        stroke: '#10B981',
        strokeWidth: 2,
        shadowColor: '#10B981'
      }
    } else if (node.preferenceScore < -0.3) {
      return {
        ...baseStyle,
        fill: '#FEF3C7',
        stroke: '#F59E0B', 
        strokeWidth: 2,
        shadowColor: '#F59E0B'
      }
    } else if (node.isUncertain) {
      return {
        ...baseStyle,
        fill: '#FFFFFF',
        stroke: '#9CA3AF',
        strokeWidth: 2,
        dash: [5, 5],
        shadowColor: '#6B7280'
      }
    }
    
    return {
      ...baseStyle,
      fill: '#FFFFFF',
      stroke: '#E5E5E5',
      strokeWidth: 1,
      shadowColor: '#000000'
    }
  }

  // Animate node appearance
  useEffect(() => {
    if (groupRef.current) {
      animateNodeAppearance(groupRef.current)
    }
  }, [])

  // Animate preference changes
  useEffect(() => {
    if (rectRef.current) {
      animatePreferenceChange(rectRef.current, node.preferenceScore)
    }
  }, [node.preferenceScore])

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onClick(node.id, e)
  }

  const handleRightClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onRightClick(node.id, e)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    document.body.style.cursor = 'pointer'
    
    // Hover animation
    if (groupRef.current) {
      groupRef.current.to({
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 0.2,
        easing: Konva.Easings.EaseOut
      })
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    document.body.style.cursor = 'default'
    
    if (groupRef.current) {
      groupRef.current.to({
        scaleX: 1,
        scaleY: 1,
        duration: 0.2,
        easing: Konva.Easings.EaseOut
      })
    }
  }

  const style = getNodeStyle()

  return (
    <Group
      ref={groupRef}
      x={node.position.x}
      y={node.position.y}
      onClick={handleClick}
      onTap={handleClick} // Mobile support
      onContextMenu={handleRightClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Node background rectangle */}
      <Rect
        ref={rectRef}
        {...style}
      />
      
      {/* Node text */}
      <Text
        text={node.label}
        x={8}
        y={node.size.height / 2 - 8}
        width={node.size.width - 16}
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fill="#111111"
        align="center"
        verticalAlign="middle"
        wrap="word"
        ellipsis={true}
      />
      
      {/* Uncertain indicator */}
      {node.isUncertain && (
        <Text
          text="Click to explore"
          x={8}
          y={node.size.height - 20}
          width={node.size.width - 16}
          fontSize={10}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#6B7280"
          align="center"
        />
      )}
      
      {/* Preference indicator */}
      {node.preferenceScore > 0.5 && (
        <Text
          text="✨ Likely interesting"
          x={8}
          y={node.size.height - 20}
          width={node.size.width - 16}
          fontSize={10}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#10B981"
          align="center"
        />
      )}
    </Group>
  )
}

export default ConceptNodeCanvas
```

### **3. useCanvasAnimations.ts - High-Performance Animations**
```tsx
import { useCallback } from 'react'
import Konva from 'konva'

export const useCanvasAnimations = () => {
  
  const animateNodeAppearance = useCallback((node: Konva.Group) => {
    // Initial state
    node.scale({ x: 0.6, y: 0.6 })
    node.opacity(0)
    
    // Animate to final state
    node.to({
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      duration: 0.4,
      easing: Konva.Easings.EaseOut,
    })
  }, [])
  
  const animatePreferenceChange = useCallback((rect: Konva.Rect, preferenceScore: number) => {
    // Glow effect for preferred nodes
    if (preferenceScore > 0.3) {
      rect.to({
        shadowBlur: 15,
        shadowOpacity: 0.4,
        duration: 0.5,
        easing: Konva.Easings.EaseInOut,
      })
    } else {
      rect.to({
        shadowBlur: 4,
        shadowOpacity: 0.1,
        duration: 0.5,
        easing: Konva.Easings.EaseInOut,
      })
    }
  }, [])
  
  const animateNodeExpansion = useCallback((parentNode: Konva.Group, childNodes: Konva.Group[]) => {
    // Stagger child node animations
    childNodes.forEach((child, index) => {
      child.scale({ x: 0, y: 0 })
      child.opacity(0)
      
      setTimeout(() => {
        child.to({
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          duration: 0.3,
          easing: Konva.Easings.EaseOut,
        })
      }, index * 100) // Stagger by 100ms
    })
  }, [])
  
  const animateConnectionDraw = useCallback((line: Konva.Line) => {
    const length = line.getLength()
    line.dashOffset(length)
    line.dash([length, length])
    
    line.to({
      dashOffset: 0,
      duration: 0.5,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        line.dash([]) // Remove dash after animation
      }
    })
  }, [])

  return {
    animateNodeAppearance,
    animatePreferenceChange,
    animateNodeExpansion,
    animateConnectionDraw
  }
}
```

---

## 📱 Mobile Touch Optimization

### **1. useCanvasInteractions.ts - Touch & Mouse Handling**
```typescript
import { useCallback, useRef } from 'react'
import { KonvaEventObject } from 'konva/lib/Node'
import Konva from 'konva'
import { useCanvasStore } from '../stores/canvasStore'

export const useCanvasInteractions = (stageRef: React.RefObject<Konva.Stage>) => {
  const longPressTimer = useRef<NodeJS.Timeout>()
  const lastTapTime = useRef(0)
  const { expandNode, setContextMenu } = useCanvasStore()

  const handleNodeClick = useCallback((nodeId: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapTime.current
    
    // Handle double tap for mobile
    if (timeSinceLastTap < 300) {
      // Double tap - same as right click
      handleNodeRightClick(nodeId, e)
    } else {
      // Single tap/click - expand node
      expandNode(nodeId)
    }
    
    lastTapTime.current = now
  }, [expandNode])

  const handleNodeRightClick = useCallback((nodeId: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return
    
    const pointerPosition = stage.getPointerPosition()
    if (pointerPosition) {
      setContextMenu(nodeId, pointerPosition)
    }
  }, [setContextMenu])

  const handleTouchStart = useCallback((nodeId: string, e: KonvaEventObject<TouchEvent>) => {
    // Long press for context menu on mobile
    longPressTimer.current = setTimeout(() => {
      handleNodeRightClick(nodeId, e)
    }, 500)
  }, [handleNodeRightClick])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }, [])

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const scaleBy = 1.05
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    
    // Limit zoom
    const clampedScale = Math.max(0.1, Math.min(3, newScale))

    stage.scale({ x: clampedScale, y: clampedScale })

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    }
    
    stage.position(newPos)
    stage.batchDraw()
  }, [])

  const handlePinch = useCallback((e: KonvaEventObject<TouchEvent>) => {
    // Mobile pinch zoom
    const stage = stageRef.current
    if (!stage) return

    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]

    if (touch1 && touch2) {
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      // Implement pinch zoom logic
      // This is a simplified version - full implementation would track gesture states
    }
  }, [])

  return {
    handleNodeClick,
    handleNodeRightClick,
    handleTouchStart,
    handleTouchEnd,
    handleWheel,
    handlePinch
  }
}
```

---

## ⚡ Performance Optimizations

### **1. Rendering Optimizations**
```typescript
// services/canvasRenderer.ts
export class CanvasRenderer {
  private static instance: CanvasRenderer
  private renderQueue: Set<string> = new Set()
  private isRendering = false

  static getInstance() {
    if (!CanvasRenderer.instance) {
      CanvasRenderer.instance = new CanvasRenderer()
    }
    return CanvasRenderer.instance
  }

  // Batch rendering updates
  scheduleRender(nodeId: string) {
    this.renderQueue.add(nodeId)
    
    if (!this.isRendering) {
      this.isRendering = true
      requestAnimationFrame(() => {
        this.performBatchRender()
        this.isRendering = false
      })
    }
  }

  private performBatchRender() {
    // Process all queued renders in single frame
    this.renderQueue.forEach(nodeId => {
      // Update specific node rendering
    })
    this.renderQueue.clear()
  }

  // Viewport culling - only render visible nodes
  cullInvisibleNodes(stage: Konva.Stage, nodes: ConceptNodeData[]) {
    const viewport = {
      x: -stage.x() / stage.scaleX(),
      y: -stage.y() / stage.scaleY(),
      width: stage.width() / stage.scaleX(),
      height: stage.height() / stage.scaleY(),
    }

    return nodes.filter(node => {
      return this.isNodeInViewport(node, viewport)
    })
  }

  private isNodeInViewport(node: ConceptNodeData, viewport: any) {
    return (
      node.position.x + node.size.width >= viewport.x &&
      node.position.x <= viewport.x + viewport.width &&
      node.position.y + node.size.height >= viewport.y &&
      node.position.y <= viewport.y + viewport.height
    )
  }
}
```

### **2. Memory Management**
```typescript
// hooks/usePerformanceOptimization.ts
export const usePerformanceOptimization = () => {
  const [fps, setFps] = useState(60)
  const [memoryUsage, setMemoryUsage] = useState(0)
  
  useEffect(() => {
    const monitor = () => {
      // Monitor FPS
      const start = performance.now()
      requestAnimationFrame(() => {
        const delta = performance.now() - start
        setFps(Math.round(1000 / delta))
      })
      
      // Monitor memory (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryUsage(memory.usedJSHeapSize / 1024 / 1024) // MB
      }
    }
    
    const interval = setInterval(monitor, 1000)
    return () => clearInterval(interval)
  }, [])

  const optimizeForLowEnd = useCallback(() => {
    // Reduce visual effects for low-end devices
    return {
      shadowsEnabled: fps > 45,
      animationsEnabled: fps > 30,
      complexShapesEnabled: memoryUsage < 100,
    }
  }, [fps, memoryUsage])

  return { fps, memoryUsage, optimizeForLowEnd }
}
```

---

## 📤 Export Functionality

### **1. Canvas to Image Export**
```typescript
// services/exportEngine.ts
export class ExportEngine {
  static async exportToImage(stage: Konva.Stage, format: 'png' | 'jpeg' = 'png'): Promise<string> {
    // Temporarily remove UI elements
    const uiLayer = stage.findOne('.ui-layer')
    if (uiLayer) {
      uiLayer.visible(false)
    }

    // Export at high resolution
    const dataURL = stage.toDataURL({
      mimeType: `image/${format}`,
      quality: 0.9,
      pixelRatio: 2 // 2x resolution for crisp export
    })

    // Restore UI elements
    if (uiLayer) {
      uiLayer.visible(true)
    }

    return dataURL
  }

  static async exportToPDF(stage: Konva.Stage): Promise<Blob> {
    // Implementation for PDF export using jsPDF
    const imageData = await this.exportToImage(stage, 'png')
    
    // Convert to PDF (requires jsPDF library)
    // Implementation depends on specific PDF requirements
    
    return new Blob([], { type: 'application/pdf' })
  }

  static exportToJSON(nodes: ConceptNodeData[], connections: any[]): string {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      nodes,
      connections,
      metadata: {
        nodeCount: nodes.length,
        connectionCount: connections.length
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  }
}
```

---

## 🚀 Deployment & Bundle Optimization

### **1. Webpack Bundle Analysis**
```typescript
// vite.config.ts - Optimized for Konva
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'konva': ['konva', 'react-konva'],
          'animations': ['framer-motion'],
          'vendor': ['react', 'react-dom', 'zustand']
        }
      }
    },
    target: 'es2015', // Better browser support
  },
  optimizeDeps: {
    include: ['konva', 'react-konva'],
  },
  server: {
    hmr: {
      overlay: false // Disable overlay in development for canvas work
    }
  }
})
```

---

## 🎯 When to Choose Konva Canvas

### **Performance Indicators**
Choose Konva when you need:
- 50+ nodes with smooth interactions
- Complex custom animations
- Export functionality
- Mobile performance optimization
- Unique visual effects

### **Development Complexity Trade-offs**
- **Higher initial complexity** but **better long-term performance**
- **More control** over rendering but **more code to maintain**
- **Canvas expertise required** but **unlimited customization**

**This Konva implementation provides maximum performance and flexibility for Surreal while maintaining clean architecture for future extensions.**