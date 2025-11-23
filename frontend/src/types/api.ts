export interface BackendNode {
  id: string
  concept: string
  label: string
  isExplored: boolean
  preferenceScore: number
  position: { x: number; y: number }
  children: string[]
  createdAt: string
}

export interface GraphContext {
  centerConcept: string
  isGenerating: boolean
  nodes: Partial<BackendNode>[]
}

export interface InitRequest {
  topic: string
}

export interface InitResponse {
  centerNode: BackendNode
  nodes: BackendNode[]
}

export interface ExpandRequest {
  node_id: string
  context: GraphContext
}

export interface ExpandResponse {
  parent_updated: BackendNode
  children: BackendNode[]
  reward: number
}

export interface PreferenceRequest {
  node_id: string
  action: 'click' | 'hover' | 'expand'
  context: GraphContext
}

export interface PreferenceResponse {
  updated_node: BackendNode
  affected_siblings: BackendNode[]
}

export interface AnalyticsRequest {
  context?: GraphContext
}

export interface AnalyticsResponse {
  total_nodes: number
  explored_nodes: number
  preferred_nodes: number
  uncertain_nodes: number
  exploration_rate: number
  preference_distribution: {
    preferred: number
    neutral: number
    uncertain: number
  }
  nodes_by_layer: Record<string, number>
  avg_uncertainty_by_layer: Record<string, number>
  reward_history: number[]
  center_concept: string
}

export interface SuggestionsRequest {
  context: GraphContext
  num_suggestions: number
}

export interface SuggestionsResponse {
  suggestions: Array<{
    node_id: string
    reasoning: string
    expected_gain: number
    uncertainty_score: number
  }>
  strategy_used: string
  total_unexplored: number
}

export interface MediaRequest {
  node_id: string
  media_type: 'image' | 'video'
  duration?: number
  resolution?: string
  aspect_ratio?: string
  wait_for_completion: boolean
}

export interface MediaResponse {
  task_id: string
  node_id: string
  media_type: 'image' | 'video'
  status: 'pending' | 'generating' | 'completed' | 'failed'
  media_url?: string
  progress?: number
}

export interface MediaStatusRequest {
  task_id: string
  node_id: string
  media_type: 'image' | 'video'
}

export interface HealthResponse {
  status: 'healthy'
  timestamp: string
  version: string
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}