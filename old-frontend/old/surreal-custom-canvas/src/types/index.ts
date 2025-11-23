// Central export hub for all types
// This ensures clean, unambiguous module resolution

// Core data structures
export interface ConceptNodeData {
  id: string
  label: string
  isUncertain: boolean // true = dashed border (expandable), false = solid border (expanded)
  isExpanded?: boolean // tracks if this node has been expanded (has children)
  preferenceScore: number // -1 to 1, where 1 is highly preferred
  children: string[]
  parentId?: string
  position?: { x: number; y: number }
  metadata?: {
    description?: string
    source?: string
    multimedia?: MultimediaContent[]
  }
}

export interface MultimediaContent {
  type: 'image' | 'video' | 'audio' | 'text'
  url: string
  title?: string
  description?: string
}

export interface Connection {
  from: string
  to: string
  style: {
    color?: string
    width?: number
    type?: 'solid' | 'dashed'
  }
}

export interface InteractionEvent {
  type: 'click' | 'rightClick' | 'hover'
  nodeId: string
  timestamp: number
  position: { x: number; y: number }
}

export interface CanvasState {
  nodes: ConceptNodeData[]
  connections: Connection[]
  selectedNodeId?: string
  isLoading: boolean
  currentTopic?: string
}

export interface DrawingTool {
  type: 'pen' | 'highlighter' | 'eraser'
  color: string
  size: number
  opacity: number
}

export interface SketchStroke {
  id: string
  points: { x: number; y: number }[]
  style: DrawingTool
}