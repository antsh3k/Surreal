import { useReducer, createContext, useContext, ReactNode } from 'react'
import { MentalMapState, MentalMapAction, ConceptNode, Connection, Position } from '../types'

// Initial state
const initialState: MentalMapState = {
  topic: '',
  nodes: [],
  connections: [],
  positions: {},
  contextMenu: null,
  isGenerating: false,
  userPreferences: {
    clickHistory: [],
    preferenceWeights: {},
    sessionStartTime: new Date(),
    totalInteractions: 0
  }
}

// Reducer function
export const mentalMapReducer = (state: MentalMapState, action: MentalMapAction): MentalMapState => {
  switch (action.type) {
    case 'SET_TOPIC':
      return {
        ...state,
        topic: action.payload
      }

    case 'ADD_NODES':
      return {
        ...state,
        nodes: [...state.nodes, ...action.payload]
      }

    case 'ADD_CONNECTIONS':
      return {
        ...state,
        connections: [...state.connections, ...action.payload]
      }

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.id
            ? { ...node, ...action.payload.updates }
            : node
        )
      }

    case 'EXPAND_NODE': {
      const { nodeId, newNodes, newConnections } = action.payload
      return {
        ...state,
        nodes: [
          ...state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, isUncertain: false, isLoading: false }
              : node
          ),
          ...newNodes
        ],
        connections: [...state.connections, ...newConnections],
        userPreferences: {
          ...state.userPreferences,
          clickHistory: [...state.userPreferences.clickHistory, nodeId],
          totalInteractions: state.userPreferences.totalInteractions + 1
        }
      }
    }

    case 'UPDATE_POSITIONS':
      return {
        ...state,
        positions: action.payload
      }

    case 'OPEN_CONTEXT_MENU':
      return {
        ...state,
        contextMenu: {
          nodeId: action.payload.nodeId,
          position: action.payload.position,
          isVisible: true
        }
      }

    case 'CLOSE_CONTEXT_MENU':
      return {
        ...state,
        contextMenu: null
      }

    case 'UPDATE_PREFERENCES': {
      const { nodeId, action: userAction } = action.payload
      const node = state.nodes.find(n => n.id === nodeId)
      if (!node) return state

      // Simple preference learning algorithm
      let preferenceScore = node.preferenceScore
      const clickHistory = state.userPreferences.clickHistory

      if (userAction === 'clicked') {
        preferenceScore += 0.3
        
        // Boost similar concepts based on recent history
        const recentClicks = clickHistory.slice(-3)
        if (recentClicks.length > 1) {
          // If user has been clicking similar types of concepts, boost this one
          preferenceScore += 0.2
        }
      } else if (userAction === 'skipped') {
        preferenceScore -= 0.1
      }

      // Clamp to [-1, 1]
      preferenceScore = Math.max(-1, Math.min(1, preferenceScore))

      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === nodeId
            ? { ...n, preferenceScore, clickCount: n.clickCount + 1 }
            : n
        ),
        userPreferences: {
          ...state.userPreferences,
          preferenceWeights: {
            ...state.userPreferences.preferenceWeights,
            [nodeId]: preferenceScore
          }
        }
      }
    }

    case 'SET_LOADING':
      return {
        ...state,
        isGenerating: action.payload
      }

    case 'RESET_MAP':
      return {
        ...initialState,
        userPreferences: {
          ...initialState.userPreferences,
          sessionStartTime: new Date()
        }
      }

    default:
      return state
  }
}

// Context
const MentalMapContext = createContext<{
  state: MentalMapState
  dispatch: React.Dispatch<MentalMapAction>
} | null>(null)

// Provider component
export const MentalMapProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(mentalMapReducer, initialState)

  return (
    <MentalMapContext.Provider value={{ state, dispatch }}>
      {children}
    </MentalMapContext.Provider>
  )
}

// Hook to use the context
export const useMentalMapStore = () => {
  const context = useContext(MentalMapContext)
  if (!context) {
    throw new Error('useMentalMapStore must be used within a MentalMapProvider')
  }
  return context
}

// Helper functions for common operations
export const useMentalMapActions = () => {
  const { dispatch } = useMentalMapStore()

  const setTopic = (topic: string) => {
    dispatch({ type: 'SET_TOPIC', payload: topic })
  }

  const addNodes = (nodes: ConceptNode[]) => {
    dispatch({ type: 'ADD_NODES', payload: nodes })
  }

  const addConnections = (connections: Connection[]) => {
    dispatch({ type: 'ADD_CONNECTIONS', payload: connections })
  }

  const expandNode = (nodeId: string, newNodes: ConceptNode[], newConnections: Connection[]) => {
    // Set node to loading first
    dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { isLoading: true } } })
    
    // Simulate API call delay - but make it more stable
    setTimeout(() => {
      dispatch({ type: 'EXPAND_NODE', payload: { nodeId, newNodes, newConnections } })
      
      // Update preferences based on the click
      dispatch({ type: 'UPDATE_PREFERENCES', payload: { nodeId, action: 'clicked' } })
    }, 1500)
  }

  const openContextMenu = (nodeId: string, position: Position) => {
    dispatch({ type: 'OPEN_CONTEXT_MENU', payload: { nodeId, position } })
  }

  const closeContextMenu = () => {
    dispatch({ type: 'CLOSE_CONTEXT_MENU' })
  }

  const resetMap = () => {
    dispatch({ type: 'RESET_MAP' })
  }

  return {
    setTopic,
    addNodes,
    addConnections,
    expandNode,
    openContextMenu,
    closeContextMenu,
    resetMap
  }
}