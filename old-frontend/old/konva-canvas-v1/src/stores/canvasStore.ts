import { create } from 'zustand'
import type { ConceptNodeData, ConnectionData, CanvasViewport, ContextMenuData } from '../types'

interface CanvasState {
  // Core data
  nodes: ConceptNodeData[]
  connections: ConnectionData[]
  
  // Canvas viewport
  viewport: CanvasViewport
  
  // UI state
  selectedNodeId: string | null
  contextMenu: ContextMenuData | null
  isLoading: boolean
  loadingMessage: string
  
  // Topic state
  currentTopic: string
  
  // Actions
  setNodes: (nodes: ConceptNodeData[]) => void
  addNode: (node: ConceptNodeData) => void
  updateNode: (nodeId: string, updates: Partial<ConceptNodeData>) => void
  removeNode: (nodeId: string) => void
  
  setConnections: (connections: ConnectionData[]) => void
  addConnection: (connection: ConnectionData) => void
  
  setViewport: (viewport: Partial<CanvasViewport>) => void
  
  setSelectedNode: (nodeId: string | null) => void
  setContextMenu: (menu: ContextMenuData | null) => void
  
  setLoading: (isLoading: boolean, message?: string) => void
  setCurrentTopic: (topic: string) => void
  
  // Helper actions
  expandNode: (nodeId: string) => Promise<void>
  generateContent: (nodeId: string, type: string) => Promise<void>
  
  // Reset
  reset: () => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  nodes: [],
  connections: [],
  viewport: { x: 0, y: 0, scale: 1 },
  selectedNodeId: null,
  contextMenu: null,
  isLoading: false,
  loadingMessage: '',
  currentTopic: '',
  
  // Basic setters
  setNodes: (nodes) => set({ nodes }),
  addNode: (node) => set(state => ({ nodes: [...state.nodes, node] })),
  updateNode: (nodeId, updates) => set(state => ({
    nodes: state.nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    )
  })),
  removeNode: (nodeId) => set(state => ({
    nodes: state.nodes.filter(node => node.id !== nodeId),
    connections: state.connections.filter(
      conn => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    ),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
  })),
  
  setConnections: (connections) => set({ connections }),
  addConnection: (connection) => set(state => ({ 
    connections: [...state.connections, connection] 
  })),
  
  setViewport: (viewport) => set(state => ({ 
    viewport: { ...state.viewport, ...viewport } 
  })),
  
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  
  setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),
  setCurrentTopic: (topic) => set({ currentTopic: topic }),
  
  // Complex actions
  expandNode: async (nodeId) => {
    const state = get()
    const node = state.nodes.find(n => n.id === nodeId)
    if (!node || node.isExpanded) return
    
    set({ isLoading: true, loadingMessage: 'Expanding concept...' })
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create child nodes positioned around the parent
      const childCount = 3
      const radius = 160
      const angleStep = (2 * Math.PI) / childCount
      const startAngle = node.level === 0 ? 0 : Math.PI / 4 // Different start angle for different levels
      
      const mockChildNodes: ConceptNodeData[] = Array.from({ length: childCount }, (_, index) => {
        const angle = startAngle + index * angleStep
        const offsetX = Math.cos(angle) * radius
        const offsetY = Math.sin(angle) * radius
        
        return {
          id: `${nodeId}-child-${index + 1}`,
          label: `${node.label} Aspect ${index + 1}`,
          concept: `${node.concept} - detailed exploration ${index + 1}`,
          isUncertain: true,
          preferenceScore: 0,
          position: { 
            x: node.position.x + offsetX, 
            y: node.position.y + offsetY 
          },
          size: { width: 200, height: 70 },
          parentId: nodeId,
          level: node.level + 1
        }
      })
      
      const newConnections: ConnectionData[] = mockChildNodes.map(child => ({
        id: `${nodeId}-${child.id}`,
        fromNodeId: nodeId,
        toNodeId: child.id,
        type: 'parent-child' as const
      }))
      
      // Update parent node
      state.updateNode(nodeId, { 
        isExpanded: true, 
        isUncertain: false,
        children: mockChildNodes.map(n => n.id)
      })
      
      // Add child nodes
      mockChildNodes.forEach(childNode => state.addNode(childNode))
      
      // Add connections
      newConnections.forEach(connection => state.addConnection(connection))
      
    } catch (error) {
      console.error('Failed to expand node:', error)
    } finally {
      set({ isLoading: false, loadingMessage: '' })
    }
  },
  
  generateContent: async (nodeId, type) => {
    set({ isLoading: true, loadingMessage: `Generating ${type}...` })
    
    try {
      // TODO: Connect to content generation service
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock content generation
      console.log(`Generated ${type} for node ${nodeId}`)
      
    } catch (error) {
      console.error('Failed to generate content:', error)
    } finally {
      set({ isLoading: false, loadingMessage: '' })
    }
  },
  
  reset: () => set({
    nodes: [],
    connections: [],
    viewport: { x: 0, y: 0, scale: 1 },
    selectedNodeId: null,
    contextMenu: null,
    isLoading: false,
    loadingMessage: '',
    currentTopic: ''
  })
}))