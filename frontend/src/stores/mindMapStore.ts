import { create } from 'zustand'
import type { ConceptNode, MindMapState } from '../types'
import { generateInitialConcepts, generateChildConcepts } from '../utils/conceptGeneration'
import { calculateRadialPositions, calculateChildPositions } from '../utils/nodeLayout'
import { updatePreferenceScore } from '../utils/preferenceEngine'

interface MindMapStore extends MindMapState {
  // Actions
  setCenterConcept: (concept: string) => Promise<void>
  expandNode: (nodeId: string) => Promise<void>
  selectNode: (nodeId: string | null) => void
  updatePreference: (nodeId: string, action: 'click' | 'hover' | 'expand') => void
  openInfoPanel: (nodeId: string, position: { x: number; y: number }) => void
  closeInfoPanel: () => void
  resetMap: () => void
}

export const useMindMapStore = create<MindMapStore>((set, get) => ({
  // Initial State
  centerConcept: '',
  nodes: [],
  isGenerating: false,
  loadingNodeId: null,
  selectedNodeId: null,
  infoPanel: null,

  // Actions
  setCenterConcept: async (concept: string) => {
    set({ 
      centerConcept: concept, 
      isGenerating: true,
      nodes: [],
      loadingNodeId: 'center'
    })
    
    try {
      // Generate initial concepts around the center topic
      const conceptLabels = await generateInitialConcepts(concept)
      const centerPosition = { x: 600, y: 400 }
      const radius = 200
      
      const positions = calculateRadialPositions(
        conceptLabels.length, 
        centerPosition, 
        radius
      )
      
      const initialNodes: ConceptNode[] = conceptLabels.map((label, index) => ({
        id: `concept-${Date.now()}-${index}`,
        label,
        concept: label,
        isExplored: false,
        preferenceScore: 0, // Start neutral
        position: positions[index],
        children: [],
        createdAt: new Date(),
        metadata: {
          keywords: [], // To be populated later
          summary: `${label} related to ${concept}`
        }
      }))
      
      set({ 
        nodes: initialNodes, 
        isGenerating: false,
        loadingNodeId: null
      })
      
      console.log(`✅ Generated ${initialNodes.length} initial concepts for "${concept}"`)
      
    } catch (error) {
      console.error('❌ Failed to generate initial concepts:', error)
      set({ 
        isGenerating: false,
        loadingNodeId: null
      })
    }
  },

  expandNode: async (nodeId: string) => {
    const { nodes } = get()
    const node = nodes.find(n => n.id === nodeId)
    
    if (!node || node.isExplored) {
      console.warn(`⚠️ Cannot expand node ${nodeId}: already explored or not found`)
      return
    }

    set({ 
      isGenerating: true,
      loadingNodeId: nodeId 
    })
    
    try {
      // Generate child concepts
      const childLabels = await generateChildConcepts(node.concept)
      const childPositions = calculateChildPositions(
        node.position,
        childLabels.length,
        150 // Distance from parent
      )
      
      const childNodes: ConceptNode[] = childLabels.map((label, index) => ({
        id: `${nodeId}-child-${Date.now()}-${index}`,
        label,
        concept: label,
        isExplored: false,
        preferenceScore: Math.random() * 0.4 - 0.1, // Random slight preference for demo
        position: childPositions[index],
        parentId: nodeId,
        children: [],
        createdAt: new Date(),
        metadata: {
          keywords: [],
          summary: `${label} - aspect of ${node.concept}`
        }
      }))
      
      set({
        nodes: [
          // Update parent node as explored and add child IDs
          ...nodes.map(n => 
            n.id === nodeId 
              ? { ...n, isExplored: true, children: childNodes.map(c => c.id) }
              : n
          ),
          // Add new child nodes
          ...childNodes
        ],
        isGenerating: false,
        loadingNodeId: null
      })
      
      console.log(`✅ Expanded "${node.label}" with ${childNodes.length} child concepts`)
      
    } catch (error) {
      console.error(`❌ Failed to expand node "${node?.label}":`, error)
      set({ 
        isGenerating: false,
        loadingNodeId: null
      })
    }
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId })
  },

  updatePreference: (nodeId: string, action: 'click' | 'hover' | 'expand') => {
    const { nodes } = get()
    const node = nodes.find(n => n.id === nodeId)
    
    if (!node) return
    
    const newScore = updatePreferenceScore(node.preferenceScore, action)
    
    set({
      nodes: nodes.map(n => 
        n.id === nodeId 
          ? { ...n, preferenceScore: newScore }
          : n
      )
    })
    
    // Also update related nodes (simple propagation)
    if (action === 'click' && Math.abs(newScore - node.preferenceScore) > 0.1) {
      // Find semantically related nodes and boost them slightly
      const relatedNodes = nodes.filter(n => 
        n.id !== nodeId && 
        (n.parentId === node.parentId || n.children.includes(nodeId))
      )
      
      if (relatedNodes.length > 0) {
        set({
          nodes: get().nodes.map(n => {
            if (relatedNodes.find(rn => rn.id === n.id)) {
              return {
                ...n,
                preferenceScore: Math.min(1, n.preferenceScore + 0.05) // Small boost
              }
            }
            return n
          })
        })
      }
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

  resetMap: () => {
    set({
      centerConcept: '',
      nodes: [],
      isGenerating: false,
      loadingNodeId: null,
      selectedNodeId: null,
      infoPanel: null
    })
  }
}))

