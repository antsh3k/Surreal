import { create } from 'zustand'
import type { ConceptNode, MindMapState } from '../types'
import { conceptService } from '../services/conceptService'
import { preferenceService } from '../services/preferenceService'
import { apiClient } from '../services/apiClient'

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

// Helper function to download and save media locally
const downloadAndSaveMedia = async (mediaUrl: string, filename: string): Promise<string> => {
  try {
    console.log(`📥 Downloading media: ${filename}`)
    
    // Download the media from the remote URL
    const response = await fetch(mediaUrl, {
      mode: 'cors',
      credentials: 'omit'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    
    // Create a local URL for the blob
    const localUrl = URL.createObjectURL(blob)
    
    console.log(`✅ Downloaded and saved media locally: ${filename}`)
    return localUrl
    
  } catch (error) {
    console.error('❌ Failed to download media:', error)
    // Return the original URL as fallback
    return mediaUrl
  }
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
          // Add new child nodes - ensure they are unexplored with dashed borders
          ...result.children.map(child => ({
            ...child,
            isExplored: false  // Force new nodes to be unexplored (dashed borders)
          }))
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
      actionMenu: null,
      lastError: null
    })

    try {
      console.log(`🎨 Real API: Generating image for concept "${parentNode.concept}"`)
      
      // Calculate outward position for image node
      const centerPosition = { x: 600, y: 400 }
      const parentDistanceFromCenter = Math.sqrt(
        Math.pow(parentNode.position.x - centerPosition.x, 2) + 
        Math.pow(parentNode.position.y - centerPosition.y, 2)
      )
      
      // Position image node outward from center, at a distance further than parent
      const angle = Math.atan2(
        parentNode.position.y - centerPosition.y,
        parentNode.position.x - centerPosition.x
      )
      const imageDistance = parentDistanceFromCenter + 250 // Proper distance for interaction
      const imageX = centerPosition.x + Math.cos(angle) * imageDistance
      const imageY = centerPosition.y + Math.sin(angle) * imageDistance

      // Create temporary loading node with proper dimensions
      const tempImageNode: ConceptNode = {
        id: `${nodeId}-image-${Date.now()}`,
        label: `Image: ${parentNode.label}`, // Show final label immediately
        concept: `Generating image for ${parentNode.concept}`,
        isExplored: false,
        preferenceScore: 0,
        position: { 
          x: imageX, 
          y: imageY 
        },
        parentId: nodeId,
        children: [],
        createdAt: new Date(),
        contentType: 'image',
        contentUrl: null, // This triggers the ImagePlaceholder
        // Add metadata for consistent sizing
        metadata: {
          isGenerating: true,
          expectedWidth: 180,
          expectedHeight: 120
        }
      }

      // Add temporary loading node
      set({
        nodes: [
          ...nodes.map(n => 
            n.id === nodeId 
              ? { ...n, children: [...n.children, tempImageNode.id], isExplored: true }
              : n
          ),
          tempImageNode
        ],
        connectionStatus: 'connected'
      })

      // Call real API
      const response = await apiClient.generateMedia({
        node_id: nodeId,
        media_type: 'image',
        prompt: `Generate a high-quality, professional illustration for the concept: "${parentNode.concept}". The image should be educational, clean, and suitable for a knowledge visualization interface. Style: modern, minimalist, informative diagram or illustration.`,
        node_concept: parentNode.concept
      })

      if (response.status === 'failed' || response.error) {
        throw new Error(response.error || 'Image generation failed')
      }

      if (!response.media_url) {
        throw new Error('No media URL returned from API')
      }

      // Download and save the image locally
      const filename = `generated-image-${nodeId}-${Date.now()}.jpg`
      const localUrl = await downloadAndSaveMedia(response.media_url, filename)

      // Update the node with the real generated image
      set({
        nodes: get().nodes.map(node => 
          node.id === tempImageNode.id 
            ? {
                ...node,
                label: `Image: ${parentNode.label}`,
                contentUrl: localUrl,
                isExplored: true, // Mark as completed media - no action menu needed
                metadata: {
                  ...node.metadata,
                  isGenerating: false
                }
              }
            : node
        ),
        isGenerating: false,
        loadingNodeId: null,
        connectionStatus: 'connected'
      })

      console.log(`✅ Image generation completed for "${parentNode.label}"`)
      
    } catch (error) {
      console.error('❌ Failed to generate image:', error)
      
      // Remove the temporary loading node on error
      set({
        nodes: get().nodes.filter(node => node.id !== tempImageNode.id),
        isGenerating: false,
        loadingNodeId: null,
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Image generation failed'
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
      actionMenu: null,
      lastError: null
    })

    try {
      console.log(`🎬 Real API: Generating video for concept "${parentNode.concept}"`)
      
      // Calculate outward position for video node
      const centerPosition = { x: 600, y: 400 }
      const parentDistanceFromCenter = Math.sqrt(
        Math.pow(parentNode.position.x - centerPosition.x, 2) + 
        Math.pow(parentNode.position.y - centerPosition.y, 2)
      )
      
      // Position video node outward from center, at a slightly different angle than image
      const baseAngle = Math.atan2(
        parentNode.position.y - centerPosition.y,
        parentNode.position.x - centerPosition.x
      )
      const videoAngle = baseAngle + (Math.PI / 6) // Offset by 30 degrees
      const videoDistance = parentDistanceFromCenter + 250 // Proper distance for interaction
      const videoX = centerPosition.x + Math.cos(videoAngle) * videoDistance
      const videoY = centerPosition.y + Math.sin(videoAngle) * videoDistance

      // Create temporary loading node with proper dimensions
      const tempVideoNode: ConceptNode = {
        id: `${nodeId}-video-${Date.now()}`,
        label: `Video: ${parentNode.label}`, // Show final label immediately
        concept: `Generating video for ${parentNode.concept}`,
        isExplored: false,
        preferenceScore: 0,
        position: { 
          x: videoX, 
          y: videoY 
        },
        parentId: nodeId,
        children: [],
        createdAt: new Date(),
        contentType: 'video',
        contentUrl: null, // This triggers the ImagePlaceholder
        // Add metadata for consistent sizing
        metadata: {
          isGenerating: true,
          expectedWidth: 150,
          expectedHeight: 150
        }
      }

      // Add temporary loading node
      set({
        nodes: [
          ...nodes.map(n => 
            n.id === nodeId 
              ? { ...n, children: [...n.children, tempVideoNode.id], isExplored: true }
              : n
          ),
          tempVideoNode
        ],
        connectionStatus: 'connected'
      })

      // Call real API
      const response = await apiClient.generateMedia({
        node_id: nodeId,
        media_type: 'video',
        prompt: `Create an educational video explaining the concept: "${parentNode.concept}". The video should be informative, engaging, and suitable for learning. Focus on clear explanations and visual demonstrations.`,
        node_concept: parentNode.concept
      })

      if (response.status === 'failed' || response.error) {
        throw new Error(response.error || 'Video generation failed')
      }

      if (!response.media_url) {
        throw new Error('No media URL returned from API')
      }

      // Download and save the video locally
      const filename = `generated-video-${nodeId}-${Date.now()}.mp4`
      const localUrl = await downloadAndSaveMedia(response.media_url, filename)

      // Update the node with the real generated video
      set({
        nodes: get().nodes.map(node => 
          node.id === tempVideoNode.id 
            ? {
                ...node,
                label: `Video: ${parentNode.label}`,
                contentUrl: localUrl,
                isExplored: true, // Mark as completed media - no action menu needed
                metadata: {
                  ...node.metadata,
                  isGenerating: false
                }
              }
            : node
        ),
        isGenerating: false,
        loadingNodeId: null,
        connectionStatus: 'connected'
      })

      console.log(`✅ Video generation completed for "${parentNode.label}"`)
      
    } catch (error) {
      console.error('❌ Failed to generate video:', error)
      
      // Remove the temporary loading node on error
      set({
        nodes: get().nodes.filter(node => node.id !== tempVideoNode.id),
        isGenerating: false,
        loadingNodeId: null,
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Video generation failed'
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
