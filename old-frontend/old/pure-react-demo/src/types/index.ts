// Core data types for Surreal Mental Maps

export interface ConceptNode {
  id: string
  label: string
  description?: string
  parentId?: string
  isUncertain: boolean
  isLoading: boolean
  preferenceScore: number // -1 to 1, where >0.3 = liked, <-0.3 = unlikely to interest
  clickCount: number
  createdAt: Date
  expandedAt?: Date
}

export interface Connection {
  id: string
  from: string
  to: string
  strength: number // 0-1 for visual weight
  type: 'parent-child' | 'related' | 'generated'
}

export interface Position {
  x: number
  y: number
}

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ContextMenu {
  nodeId: string
  position: Position
  isVisible: boolean
}

export interface MentalMapState {
  topic: string
  nodes: ConceptNode[]
  connections: Connection[]
  positions: Record<string, Position>
  contextMenu: ContextMenu | null
  isGenerating: boolean
  userPreferences: UserPreferences
}

export interface UserPreferences {
  clickHistory: string[] // ordered list of clicked node IDs
  preferenceWeights: Record<string, number> // concept -> preference score
  sessionStartTime: Date
  totalInteractions: number
}

export interface LayoutOptions {
  algorithm: 'radial' | 'tree' | 'force'
  spacing: number
  centerX: number
  centerY: number
}

export interface ExportOptions {
  format: 'svg' | 'png' | 'json'
  scale: number
  includeMetadata: boolean
}

// Action types for state management
export type MentalMapAction = 
  | { type: 'SET_TOPIC'; payload: string }
  | { type: 'ADD_NODES'; payload: ConceptNode[] }
  | { type: 'ADD_CONNECTIONS'; payload: Connection[] }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<ConceptNode> } }
  | { type: 'EXPAND_NODE'; payload: { nodeId: string; newNodes: ConceptNode[]; newConnections: Connection[] } }
  | { type: 'UPDATE_POSITIONS'; payload: Record<string, Position> }
  | { type: 'OPEN_CONTEXT_MENU'; payload: { nodeId: string; position: Position } }
  | { type: 'CLOSE_CONTEXT_MENU' }
  | { type: 'UPDATE_PREFERENCES'; payload: { nodeId: string; action: 'clicked' | 'expanded' | 'skipped' } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_MAP' }

// Demo data types
export interface DemoScenario {
  id: string
  name: string
  topic: string
  initialNodes: ConceptNode[]
  expansionData: Record<string, ConceptNode[]> // nodeId -> child nodes
}