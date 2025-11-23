import { atom } from 'jotai'
import type { ConceptNodeData, Connection, CanvasState, InteractionEvent } from '../types'

// Core canvas state
export const canvasStateAtom = atom<CanvasState>({
  nodes: [],
  connections: [],
  isLoading: false,
  currentTopic: undefined,
})

// Selected node atom
export const selectedNodeAtom = atom<string | null>(null)

// Drawing mode state
export const isDrawingModeAtom = atom<boolean>(false)

// Interaction history for preference learning
export const interactionHistoryAtom = atom<InteractionEvent[]>([])

// Derived atoms for computed state
export const nodesByIdAtom = atom((get) => {
  const state = get(canvasStateAtom)
  return state.nodes.reduce((acc, node) => {
    acc[node.id] = node
    return acc
  }, {} as Record<string, ConceptNodeData>)
})

// Actions
export const addNodeAtom = atom(
  null,
  (get, set, node: ConceptNodeData) => {
    const currentState = get(canvasStateAtom)
    set(canvasStateAtom, {
      ...currentState,
      nodes: [...currentState.nodes, node]
    })
  }
)

export const updateNodeAtom = atom(
  null,
  (get, set, nodeId: string, updates: Partial<ConceptNodeData>) => {
    const currentState = get(canvasStateAtom)
    set(canvasStateAtom, {
      ...currentState,
      nodes: currentState.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    })
  }
)

export const addConnectionAtom = atom(
  null,
  (get, set, connection: Connection) => {
    const currentState = get(canvasStateAtom)
    set(canvasStateAtom, {
      ...currentState,
      connections: [...currentState.connections, connection]
    })
  }
)

export const recordInteractionAtom = atom(
  null,
  (get, set, interaction: InteractionEvent) => {
    const history = get(interactionHistoryAtom)
    set(interactionHistoryAtom, [...history, interaction])
    
    // Update preference learning based on interaction
    updatePreferenceLearning(get, set, interaction)
  }
)

// Preference learning algorithm - follows UX timing (3-4 interactions before hints)
function updatePreferenceLearning(
  get: any,
  set: any,
  interaction: InteractionEvent
) {
  if (interaction.type !== 'click') return
  
  const history = get(interactionHistoryAtom)
  const nodes = get(canvasStateAtom).nodes
  
  // Count total meaningful interactions (not just clicks on same node)
  const totalInteractions = history.filter((event: InteractionEvent) => event.type === 'click').length
  
  // NO preference hints until after 3+ interactions (following UX spec)
  if (totalInteractions < 3) {
    // Keep all nodes at neutral (0) preference score
    nodes.forEach((node: ConceptNodeData) => {
      if (node.preferenceScore !== 0) {
        set(updateNodeAtom, node.id, { preferenceScore: 0 })
      }
    })
    return
  }
  
  // After 3+ interactions, start showing subtle preferences
  const clickCounts = history
    .filter((event: InteractionEvent) => event.type === 'click')
    .reduce((acc: Record<string, number>, event: InteractionEvent) => {
      acc[event.nodeId] = (acc[event.nodeId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  // Calculate preference scores with progressive scaling
  nodes.forEach((node: ConceptNodeData) => {
    const clickCount = clickCounts[node.id] || 0
    let newScore = 0
    
    if (totalInteractions >= 3 && clickCount > 0) {
      // Progressive preference learning:
      // 3-4 interactions: subtle hints (0.1-0.3)
      // 5-6 interactions: medium hints (0.3-0.6) 
      // 7+ interactions: strong hints (0.6-1.0)
      if (totalInteractions < 5) {
        newScore = Math.min(0.3, clickCount * 0.15) // Subtle hints
      } else if (totalInteractions < 7) {
        newScore = Math.min(0.6, clickCount * 0.25) // Medium hints
      } else {
        newScore = Math.min(1.0, clickCount * 0.35) // Strong hints
      }
    }
    
    if (newScore !== node.preferenceScore) {
      set(updateNodeAtom, node.id, { preferenceScore: newScore })
    }
  })
}