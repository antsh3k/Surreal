# 🚀 React Flow Implementation Guide

### **Complete setup for Surreal Mental Maps using React Flow + Framer Motion**

---

## 🎯 Quick Start (15 minutes to working demo)

### **1. Project Setup**
```bash
# Create new Vite project
npm create vite surreal-react-flow -- --template react-ts
cd surreal-react-flow

# Install dependencies
npm install @xyflow/react framer-motion zustand tailwindcss
npm install -D @tailwindcss/typography autoprefixer postcss

# Setup Tailwind
npx tailwindcss init -p
```

### **2. Configure Tailwind (tailwind.config.js)**
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
        'pulse-gentle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
```

### **3. Add CSS (src/index.css)**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* React Flow default styles */
@import '@xyflow/react/dist/style.css';

/* Custom node styles */
.concept-node {
  @apply px-4 py-2 rounded-lg border-2 bg-white shadow-sm cursor-pointer;
  @apply transition-all duration-200 ease-out;
  font-family: 'Inter', system-ui, sans-serif;
}

.concept-node.uncertain {
  @apply border-dashed border-gray-400;
}

.concept-node.liked {
  @apply border-preference-liked bg-green-50;
}

.concept-node.neutral {
  @apply border-gray-300;
}

.concept-node.uncertain-relevance {
  @apply border-preference-uncertain bg-orange-50;
}

/* Context menu styles */
.context-menu {
  @apply bg-white rounded-lg shadow-lg border p-2 min-w-48;
  @apply animate-in fade-in-0 zoom-in-95 duration-200;
}
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── nodes/
│   │   ├── ConceptNode.tsx          # Main node component
│   │   ├── LoadingNode.tsx          # Node loading state
│   │   └── index.ts                 # Export all node types
│   ├── ui/
│   │   ├── TopicInput.tsx           # Initial topic input
│   │   ├── ContextMenu.tsx          # Right-click menu
│   │   ├── PreferenceLearning.tsx   # Preference indicators
│   │   └── StatusBar.tsx            # System feedback
│   └── layout/
│       ├── MentalMapCanvas.tsx      # Main React Flow wrapper
│       └── MobileControls.tsx       # Touch-specific UI
├── stores/
│   ├── mentalMapStore.ts            # Zustand state management  
│   ├── preferencesStore.ts          # User preference learning
│   └── uiStore.ts                   # UI state (menus, loading)
├── services/
│   ├── conceptGeneration.ts         # AI integration
│   ├── preferenceEngine.ts          # Learning algorithm
│   └── layoutAlgorithms.ts          # Node positioning
├── hooks/
│   ├── useConceptExpansion.ts       # Node expansion logic
│   ├── usePreferenceLearning.ts     # Preference tracking
│   └── useMobileDetection.ts        # Device detection
├── types/
│   └── index.ts                     # TypeScript definitions
└── App.tsx                          # Main application
```

---

## 🧩 Core Components

### **1. ConceptNode.tsx**
```tsx
import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { useMentalMapStore } from '../stores/mentalMapStore'

interface ConceptNodeData {
  label: string
  isUncertain: boolean
  preferenceScore: number // -1 to 1, 0 = neutral
  isLoading: boolean
  concept: string
}

const ConceptNode = memo(({ data, id }: NodeProps<ConceptNodeData>) => {
  const { expandNode, updatePreference } = useMentalMapStore()
  
  const getNodeStyle = () => {
    if (data.isLoading) return 'animate-pulse-gentle'
    if (data.isUncertain) return 'uncertain'
    if (data.preferenceScore > 0.3) return 'liked'
    if (data.preferenceScore < -0.3) return 'uncertain-relevance'
    return 'neutral'
  }

  const handleClick = () => {
    if (data.isUncertain) {
      expandNode(id)
      updatePreference(id, 'clicked')
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    // Open context menu for pragmatic actions
    useMentalMapStore.getState().openContextMenu(id, { x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <motion.div
        className={`concept-node ${getNodeStyle()}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="text-sm font-medium text-gray-900">
          {data.label}
        </div>
        
        {data.isUncertain && (
          <div className="text-xs text-gray-500 mt-1">
            Click to explore
          </div>
        )}
        
        {data.preferenceScore > 0.5 && (
          <div className="text-xs text-green-600 mt-1">
            Likely interesting ✨
          </div>
        )}
      </motion.div>

      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  )
})

export default ConceptNode
```

### **2. MentalMapCanvas.tsx**
```tsx
import { useCallback, useState, useEffect } from 'react'
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  Connection
} from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import ConceptNode from '../nodes/ConceptNode'
import { useMentalMapStore } from '../../stores/mentalMapStore'
import { usePreferenceLearning } from '../../hooks/usePreferenceLearning'

const nodeTypes = {
  concept: ConceptNode,
}

const MentalMapCanvas = () => {
  const { 
    nodes: storeNodes, 
    edges: storeEdges, 
    isLoading,
    topic 
  } = useMentalMapStore()
  
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges)
  
  usePreferenceLearning() // Hook for learning user preferences

  // Sync with store
  useEffect(() => {
    setNodes(storeNodes)
    setEdges(storeEdges)
  }, [storeNodes, storeEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      // Handle manual connections if needed
    },
    []
  )

  return (
    <div className="w-full h-screen bg-gray-50">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-700">Expanding knowledge...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-white"
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#E5E5E5', strokeWidth: 2 },
          animated: false,
        }}
      >
        <Background color="#F3F4F6" gap={20} />
        <Controls className="bg-white border shadow-sm" />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as any
            if (data?.preferenceScore > 0.3) return '#10B981'
            if (data?.preferenceScore < -0.3) return '#F59E0B'
            return '#6B7280'
          }}
          className="bg-white border shadow-sm"
        />
      </ReactFlow>
    </div>
  )
}

export default MentalMapCanvas
```

### **3. Mental Map Store (Zustand)**
```typescript
import { create } from 'zustand'
import { Node, Edge } from '@xyflow/react'

interface ConceptNodeData {
  label: string
  isUncertain: boolean
  preferenceScore: number
  isLoading: boolean
  concept: string
  sources?: string[]
  expansionCount: number
}

interface MentalMapState {
  nodes: Node<ConceptNodeData>[]
  edges: Edge[]
  topic: string
  isLoading: boolean
  contextMenu: { nodeId: string; position: { x: number; y: number } } | null
  
  // Actions
  setTopic: (topic: string) => void
  expandNode: (nodeId: string) => Promise<void>
  updatePreference: (nodeId: string, action: 'clicked' | 'skipped' | 'generated') => void
  openContextMenu: (nodeId: string, position: { x: number; y: number }) => void
  closeContextMenu: () => void
  generateContent: (nodeId: string, type: 'image' | 'summary' | 'video') => Promise<void>
}

const useMentalMapStore = create<MentalMapState>((set, get) => ({
  nodes: [],
  edges: [],
  topic: '',
  isLoading: false,
  contextMenu: null,

  setTopic: async (topic) => {
    set({ topic, isLoading: true })
    
    // Generate initial concepts
    const initialConcepts = await generateConceptsFromTopic(topic)
    const initialNodes = initialConcepts.map((concept, index) => ({
      id: `concept-${index}`,
      type: 'concept',
      position: { 
        x: Math.cos(index * 2 * Math.PI / initialConcepts.length) * 200 + 400,
        y: Math.sin(index * 2 * Math.PI / initialConcepts.length) * 200 + 300
      },
      data: {
        label: concept,
        isUncertain: true,
        preferenceScore: 0,
        isLoading: false,
        concept,
        expansionCount: 0
      }
    }))

    set({ nodes: initialNodes, isLoading: false })
  },

  expandNode: async (nodeId) => {
    const { nodes } = get()
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    // Set node as loading
    set({
      nodes: nodes.map(n => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, isLoading: true } }
          : n
      )
    })

    try {
      // Generate child concepts
      const childConcepts = await generateChildConcepts(node.data.concept)
      
      const newNodes = childConcepts.map((concept, index) => ({
        id: `${nodeId}-child-${index}`,
        type: 'concept',
        position: {
          x: node.position.x + (index - childConcepts.length/2) * 150,
          y: node.position.y + 120
        },
        data: {
          label: concept,
          isUncertain: true,
          preferenceScore: calculatePreferenceScore(concept, get()),
          isLoading: false,
          concept,
          expansionCount: 0
        }
      }))

      const newEdges = childConcepts.map((_, index) => ({
        id: `${nodeId}-edge-${index}`,
        source: nodeId,
        target: `${nodeId}-child-${index}`,
        type: 'smoothstep'
      }))

      set({
        nodes: [
          ...get().nodes.map(n => 
            n.id === nodeId 
              ? { ...n, data: { ...n.data, isUncertain: false, isLoading: false } }
              : n
          ),
          ...newNodes
        ],
        edges: [...get().edges, ...newEdges]
      })

    } catch (error) {
      console.error('Error expanding node:', error)
      set({
        nodes: nodes.map(n => 
          n.id === nodeId 
            ? { ...n, data: { ...n.data, isLoading: false } }
            : n
        )
      })
    }
  },

  updatePreference: (nodeId, action) => {
    // Update preference learning based on user action
    const preferenceUpdate = action === 'clicked' ? 0.1 : 
                           action === 'skipped' ? -0.1 : 0.05
    
    set({
      nodes: get().nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              preferenceScore: Math.max(-1, Math.min(1, 
                node.data.preferenceScore + preferenceUpdate
              ))
            }
          }
        }
        return node
      })
    })
    
    // Update related nodes based on similarity
    updateRelatedNodePreferences(nodeId, preferenceUpdate)
  },

  openContextMenu: (nodeId, position) => {
    set({ contextMenu: { nodeId, position } })
  },

  closeContextMenu: () => {
    set({ contextMenu: null })
  },

  generateContent: async (nodeId, type) => {
    // Implementation for generating multimedia content
    console.log(`Generating ${type} for node ${nodeId}`)
  }
}))

// Helper functions
async function generateConceptsFromTopic(topic: string): Promise<string[]> {
  // TODO: Integrate with OpenAI API
  return [
    'Core Principles',
    'Historical Context', 
    'Practical Applications',
    'Related Theories'
  ]
}

async function generateChildConcepts(parentConcept: string): Promise<string[]> {
  // TODO: Integrate with OpenAI API  
  return [
    `${parentConcept} - Fundamentals`,
    `${parentConcept} - Examples`,
    `${parentConcept} - Critiques`
  ]
}

function calculatePreferenceScore(concept: string, state: MentalMapState): number {
  // Simple preference learning based on past interactions
  // TODO: Implement more sophisticated preference algorithm
  return 0
}

function updateRelatedNodePreferences(nodeId: string, preferenceChange: number) {
  // TODO: Update semantically related nodes
}

export { useMentalMapStore }
```

---

## 🎨 Animation Patterns

### **1. Node Expansion Animation**
```tsx
const NodeExpansionWrapper = ({ children, isNew }: { children: React.ReactNode, isNew: boolean }) => (
  <motion.div
    initial={isNew ? { scale: 0.6, opacity: 0, y: -20 } : false}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.4, 
      ease: "easeOut",
      delay: isNew ? Math.random() * 0.2 : 0 // Stagger new nodes
    }}
  >
    {children}
  </motion.div>
)
```

### **2. Preference Learning Animation**
```tsx
const PreferenceGlow = ({ score }: { score: number }) => (
  <motion.div
    className="absolute inset-0 rounded-lg pointer-events-none"
    animate={{
      boxShadow: score > 0.3 
        ? `0 0 20px rgba(16, 185, 129, ${score * 0.3})` 
        : score < -0.3
        ? `0 0 20px rgba(245, 158, 11, ${Math.abs(score) * 0.3})`
        : 'none'
    }}
    transition={{ duration: 1, ease: "easeOut" }}
  />
)
```

---

## 📱 Mobile Optimization

### **1. Touch Gesture Handling**
```tsx
const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return { isMobile }
}

// In ConceptNode component:
const handleTouch = {
  onTouchStart: (e) => {
    longPressTimer.current = setTimeout(() => {
      // Trigger context menu on long press
      handleContextMenu(e as any)
    }, 500)
  },
  onTouchEnd: () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }
}
```

### **2. Responsive Layout**
```css
@media (max-width: 768px) {
  .concept-node {
    @apply px-3 py-2 text-sm;
    min-width: 100px;
  }
  
  .react-flow__controls {
    @apply bottom-20 right-4;
  }
  
  .react-flow__minimap {
    @apply hidden;
  }
}
```

---

## 🚀 Deployment Setup

### **1. Build Configuration (vite.config.ts)**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-flow': ['@xyflow/react'],
          'framer-motion': ['framer-motion'],
          'vendor': ['react', 'react-dom']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
```

### **2. Environment Variables (.env)**
```bash
VITE_OPENAI_API_KEY=your_openai_key
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=Surreal Mental Maps
```

### **3. Vercel Deployment (vercel.json)**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## 🎯 Next Steps & Extensions

### **Immediate Extensions (Day 2-3)**
1. **Context Menu Implementation**
   - Image generation integration
   - Content export features  
   - Node editing capabilities

2. **Backend Integration**
   - OpenAI API for concept generation
   - User preference persistence
   - Real-time collaboration prep

3. **Advanced Animations**
   - Smooth layout transitions
   - Preference visualization effects
   - Loading state improvements

### **Production Features (Week 2+)**
1. **Performance Optimization**
   - Virtual scrolling for many nodes
   - Edge bundling for complex graphs
   - Memoization and optimization

2. **Collaboration Features**
   - Real-time shared maps
   - User presence indicators  
   - Conflict resolution

3. **Export & Integration**
   - Various export formats
   - API for external tools
   - Embed capabilities

---

## 📊 Success Metrics

### **Technical Targets**
- [ ] Initial concept generation: <3 seconds
- [ ] Node expansion: <2 seconds  
- [ ] Smooth 60fps animations
- [ ] Mobile touch responsiveness
- [ ] Bundle size <1MB

### **UX Targets**
- [ ] Intuitive without tutorial
- [ ] Preference learning visible after 5 interactions
- [ ] Context menus discoverable
- [ ] Professional demo quality

This React Flow implementation provides the fastest path to a working Surreal prototype while maintaining professional polish and extensibility for future features.