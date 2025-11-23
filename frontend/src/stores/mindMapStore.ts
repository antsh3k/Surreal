import { create } from 'zustand'
import type { ConceptNode, MindMapState } from '../types'
import { conceptService } from '../services/conceptService'
import { preferenceService } from '../services/preferenceService'

interface MindMapStore extends MindMapState {
  // New state for API integration
  connectionStatus: 'connected' | 'disconnected' | 'error'
  lastError: string | null
  sessionId: string | null

  // Actions
  setCenterConcept: (concept: string) => Promise<void>
  expandNode: (nodeId: string) => Promise<void>
  selectNode: (nodeId: string | null) => void
  updatePreference: (nodeId: string, action: 'click' | 'hover' | 'expand') => Promise<void>
  openInfoPanel: (nodeId: string, position: { x: number; y: number }) => void
  closeInfoPanel: () => void
  showActionMenu: (nodeId: string, position: { x: number; y: number }) => void
  hideActionMenu: () => void
  generateImage: (nodeId: string) => Promise<void>
  generateVideo: (nodeId: string) => Promise<void>
  resetMap: () => void
  clearError: () => void
  testConnection: () => Promise<boolean>
}

export const useMindMapStore = create<MindMapStore>((set, get) => ({
  // Initial State
  centerConcept: '',
  nodes: [],
  isGenerating: false,
  loadingNodeId: null,
  selectedNodeId: null,
  infoPanel: null,
  actionMenu: null,
  
  // New API state
  connectionStatus: 'disconnected',
  lastError: null,
  sessionId: null,

  // Actions
  setCenterConcept: async (concept: string) => {
    set({ 
      centerConcept: concept, 
      isGenerating: true,
      nodes: [],
      loadingNodeId: 'center',
      lastError: null
    })
    
    try {
      // Use real API to initialize topic
      const result = await conceptService.initializeTopic(concept)
      
      set({ 
        nodes: result.nodes, 
        isGenerating: false,
        loadingNodeId: null,
        connectionStatus: 'connected'
      })
      
      console.log(`✅ API-generated center node + ${result.nodes.length - 1} initial concepts for "${concept}"`)
      
    } catch (error) {
      console.error('❌ Failed to initialize topic via API:', error)
      set({ 
        isGenerating: false,
        loadingNodeId: null,
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  expandNode: async (nodeId: string) => {
    const state = get()
    const { nodes } = state
    const node = nodes.find(n => n.id === nodeId)
    
    if (!node || node.isExplored) {
      console.warn(`⚠️ Cannot expand node ${nodeId}: already explored or not found`)
      return
    }

    set({ 
      isGenerating: true,
      loadingNodeId: nodeId,
      lastError: null
    })
    
    try {
      // Use real API to expand node
      const result = await conceptService.expandNode(nodeId, state)
      
      set({
        nodes: [
          // Update parent node with expanded state and children IDs
          ...nodes.map(n => 
            n.id === nodeId 
              ? { ...result.parentUpdated, children: result.children.map(c => c.id) }
              : n
          ),
          // Add new child nodes
          ...result.children
        ],
        isGenerating: false,
        loadingNodeId: null,
        connectionStatus: 'connected'
      })
      
      console.log(`✅ API-expanded "${node.label}" with ${result.children.length} child concepts (reward: ${result.reward})`)
      
    } catch (error) {
      console.error(`❌ Failed to expand node "${node?.label}" via API:`, error)
      set({ 
        isGenerating: false,
        loadingNodeId: null,
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId })
  },

  updatePreference: async (nodeId: string, action: 'click' | 'hover' | 'expand') => {
    const state = get()
    const { nodes } = state
    const node = nodes.find(n => n.id === nodeId)
    
    if (!node) return
    
    try {
      // Use real API to update preference
      const result = await preferenceService.updatePreference(nodeId, action, state)
      
      set({
        nodes: nodes.map(n => {
          // Update the target node
          if (n.id === nodeId) {
            return result.updatedNode
          }
          // Update affected siblings
          const affectedSibling = result.affectedSiblings.find(sibling => sibling.id === n.id)
          if (affectedSibling) {
            return affectedSibling
          }
          return n
        }),
        connectionStatus: 'connected'
      })
      
      console.log(`✅ API-updated preference for "${node.label}" with action "${action}"`)
      
    } catch (error) {
      console.error(`❌ Failed to update preference for node "${node.label}" via API:`, error)
      set({
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },


  openInfoPanel: (nodeId: string, position: { x: number; y: number }) => {
    set({
      infoPanel: { nodeId, position },
      selectedNodeId: nodeId
    })
  },

  closeInfoPanel: () => {
    set({ 
      infoPanel: null,
      selectedNodeId: null 
    })
  },

  showActionMenu: (nodeId: string, position: { x: number; y: number }) => {
    set({
      actionMenu: { nodeId, position, isVisible: true },
      infoPanel: null // Close info panel if open
    })
  },

  hideActionMenu: () => {
    set({ actionMenu: null })
  },

  generateImage: async (nodeId: string) => {
    const state = get()
    const { nodes } = state
    const parentNode = nodes.find(n => n.id === nodeId)
    
    if (!parentNode) return

    set({ 
      isGenerating: true,
      loadingNodeId: nodeId,
      actionMenu: null
    })

    try {
      // Mock image generation with test asset
      const imageNode: ConceptNode = {
        id: `${nodeId}-image-${Date.now()}`,
        label: `Image: ${parentNode.label}`,
        concept: `Generated image for ${parentNode.concept}`,
        isExplored: true,
        preferenceScore: 0,
        position: { 
          x: parentNode.position.x + 200, 
          y: parentNode.position.y + 100 
        },
        parentId: nodeId,
        children: [],
        createdAt: new Date(),
        contentType: 'image',
        contentUrl: '/picture_test_jpg.jpg'
      }

      set({
        nodes: [
          ...nodes.map(n => 
            n.id === nodeId 
              ? { ...n, children: [...n.children, imageNode.id], isExplored: true }
              : n
          ),
          imageNode
        ],
        isGenerating: false,
        loadingNodeId: null
      })

      console.log(`✅ Generated image node for "${parentNode.label}"`)
      
    } catch (error) {
      console.error('❌ Failed to generate image:', error)
      set({ 
        isGenerating: false,
        loadingNodeId: null,
        lastError: 'Failed to generate image'
      })
    }
  },

  generateVideo: async (nodeId: string) => {
    const state = get()
    const { nodes } = state
    const parentNode = nodes.find(n => n.id === nodeId)
    
    if (!parentNode) return

    set({ 
      isGenerating: true,
      loadingNodeId: nodeId,
      actionMenu: null
    })

    try {
      // Mock video generation with test asset
      const videoNode: ConceptNode = {
        id: `${nodeId}-video-${Date.now()}`,
        label: `Video: ${parentNode.label}`,
        concept: `Generated video for ${parentNode.concept}`,
        isExplored: true,
        preferenceScore: 0,
        position: { 
          x: parentNode.position.x - 200, 
          y: parentNode.position.y + 100 
        },
        parentId: nodeId,
        children: [],
        createdAt: new Date(),
        contentType: 'video',
        contentUrl: '/video_test.mp4'
      }

      set({
        nodes: [
          ...nodes.map(n => 
            n.id === nodeId 
              ? { ...n, children: [...n.children, videoNode.id], isExplored: true }
              : n
          ),
          videoNode
        ],
        isGenerating: false,
        loadingNodeId: null
      })

      console.log(`✅ Generated video node for "${parentNode.label}"`)
      
    } catch (error) {
      console.error('❌ Failed to generate video:', error)
      set({ 
        isGenerating: false,
        loadingNodeId: null,
        lastError: 'Failed to generate video'
      })
    }
  },

  resetMap: () => {
    set({
      centerConcept: '',
      nodes: [],
      isGenerating: false,
      loadingNodeId: null,
      selectedNodeId: null,
      infoPanel: null,
      actionMenu: null,
      connectionStatus: 'disconnected',
      lastError: null,
      sessionId: null
    })
  },

  clearError: () => {
    set({ lastError: null })
  },

  testConnection: async () => {
    try {
      const isHealthy = await conceptService.testConnection()
      set({ 
        connectionStatus: isHealthy ? 'connected' : 'error',
        lastError: isHealthy ? null : 'Backend health check failed'
      })
      return isHealthy
    } catch (error) {
      set({ 
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Connection test failed'
      })
      return false
    }
  }
}))
