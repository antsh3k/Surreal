import { apiClient } from './apiClient'
import { NodeAdapter } from '../adapters/nodeAdapter'
import type { ConceptNode, MindMapState } from '../types'

export class ConceptService {
  private static instance: ConceptService | null = null

  static getInstance(): ConceptService {
    if (!ConceptService.instance) {
      ConceptService.instance = new ConceptService()
    }
    return ConceptService.instance
  }

  async initializeTopic(topic: string): Promise<{
    centerNode: ConceptNode
    nodes: ConceptNode[]
  }> {
    try {
      console.log(`🚀 Initializing topic: "${topic}"`)
      
      const response = await apiClient.init({ topic })
      console.log('✅ Backend response:', response)
      
      const result = NodeAdapter.fromInitResponse(response)
      
      // Apply canvas-specific positioning
      result.nodes = NodeAdapter.calculateCanvasPositions(result.nodes)
      
      console.log('✅ Processed nodes:', result)
      return result
      
    } catch (error) {
      console.error('❌ Failed to initialize topic:', error)
      throw new Error(`Failed to initialize topic "${topic}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async expandNode(
    nodeId: string, 
    currentState: MindMapState
  ): Promise<{
    parentUpdated: ConceptNode
    children: ConceptNode[]
    reward: number
  }> {
    try {
      console.log(`🚀 Expanding node: "${nodeId}"`)
      
      const context = NodeAdapter.buildContext(currentState)
      const response = await apiClient.expand({ node_id: nodeId, context })
      
      console.log('✅ Expand response:', response)
      
      const result = NodeAdapter.fromExpandResponse(response)
      
      // Apply canvas-specific positioning for new children
      const allNodes = [...currentState.nodes, ...result.children]
      const repositionedNodes = NodeAdapter.calculateCanvasPositions(allNodes)
      
      // Extract just the new children with updated positions
      result.children = repositionedNodes.filter(node => 
        result.children.some(child => child.id === node.id)
      )
      
      console.log('✅ Processed expansion:', result)
      return result
      
    } catch (error) {
      console.error(`❌ Failed to expand node "${nodeId}":`, error)
      throw new Error(`Failed to expand node: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const health = await apiClient.health()
      console.log('✅ Backend health check:', health)
      return health.status === 'healthy'
    } catch (error) {
      console.error('❌ Backend connection failed:', error)
      return false
    }
  }
}

export const conceptService = ConceptService.getInstance()