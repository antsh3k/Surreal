export interface ConceptNode {
  id: string
  label: string
  concept: string
  isExplored: boolean
  preferenceScore: number // -1 to 1, 0 = neutral
  position: { x: number; y: number }
  parentId?: string
  children: string[]
  createdAt: Date
  contentType: 'text' | 'image' | 'video'
  contentUrl?: string
  metadata?: {
    sources?: string[]
    keywords?: string[]
    summary?: string
    isGenerating?: boolean
    expectedWidth?: number
    expectedHeight?: number
  }
}

export interface MindMapState {
  centerConcept: string
  nodes: ConceptNode[]
  isGenerating: boolean
  loadingNodeId: string | null
  selectedNodeId: string | null
  infoPanel: {
    nodeId: string
    position: { x: number; y: number }
  } | null
  actionMenu: {
    nodeId: string
    position: { x: number; y: number }
    isVisible: boolean
  } | null
}

export interface UIState {
  isInitialPromptVisible: boolean
  isMobileView: boolean
  canvasViewport: {
    zoom: number
    center: { x: number; y: number }
  }
}

export type NodeInteraction = 'click' | 'hover' | 'expand' | 'info'

export interface PreferenceLearningData {
  nodeId: string
  action: NodeInteraction
  timestamp: Date
  previousScore: number
  newScore: number
}

