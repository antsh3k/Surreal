// Core data types for Surreal Mental Maps
export interface ConceptNodeData {
  id: string
  label: string
  concept: string
  isUncertain: boolean
  preferenceScore: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  parentId?: string
  children?: string[]
  isExpanded?: boolean
  level: number
  generatedContent?: MultimediaContent[]
}

export interface MultimediaContent {
  id: string
  type: 'diagram' | 'video' | 'summary' | 'link'
  title: string
  content: string
  metadata?: Record<string, any>
}

export interface ConnectionData {
  id: string
  fromNodeId: string
  toNodeId: string
  type: 'parent-child' | 'related' | 'generated'
}

export interface CanvasViewport {
  x: number
  y: number
  scale: number
}

export interface ContextMenuData {
  nodeId: string
  position: { x: number; y: number }
  visible: boolean
}

export interface PreferenceLearningState {
  clickHistory: string[]
  conceptPreferences: Record<string, number>
  topicPreferences: Record<string, number>
  learningEnabled: boolean
}

// Konva-specific type extensions
declare module 'konva/lib/Node' {
  interface Node {
    conceptData?: ConceptNodeData
  }
}