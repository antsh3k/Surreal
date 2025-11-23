import { apiClient } from './apiClient'
import { NodeAdapter } from '../adapters/nodeAdapter'
import type { ConceptNode, MindMapState, NodeInteraction } from '../types'

export class PreferenceService {
  private static instance: PreferenceService | null = null

  static getInstance(): PreferenceService {
    if (!PreferenceService.instance) {
      PreferenceService.instance = new PreferenceService()
    }
    return PreferenceService.instance
  }

  async updatePreference(
    nodeId: string, 
    action: NodeInteraction, 
    currentState: MindMapState
  ): Promise<{
    updatedNode: ConceptNode
    affectedSiblings: ConceptNode[]
  }> {
    try {
      console.log(`🚀 Updating preference for node "${nodeId}" with action "${action}"`)
      
      // Map frontend actions to backend actions
      const backendAction = this.mapActionToBackend(action)
      
      const context = NodeAdapter.buildContext(currentState)
      const response = await apiClient.updatePreference({ 
        node_id: nodeId, 
        action: backendAction, 
        context 
      })
      
      console.log('✅ Preference response:', response)
      
      const result = NodeAdapter.fromPreferenceResponse(response)
      
      console.log('✅ Processed preference update:', result)
      return result
      
    } catch (error) {
      console.error(`❌ Failed to update preference for node "${nodeId}":`, error)
      throw new Error(`Failed to update preference: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private mapActionToBackend(action: NodeInteraction): 'click' | 'hover' | 'expand' {
    switch (action) {
      case 'click':
      case 'info': // Map info panel opening to click
        return 'click'
      case 'hover':
        return 'hover'
      case 'expand':
        return 'expand'
      default:
        return 'click' // Default fallback
    }
  }

  async batchUpdatePreferences(
    updates: Array<{
      nodeId: string
      action: NodeInteraction
    }>, 
    currentState: MindMapState
  ): Promise<{
    updatedNodes: ConceptNode[]
    allAffectedNodes: ConceptNode[]
  }> {
    try {
      console.log(`🚀 Batch updating preferences for ${updates.length} nodes`)
      
      const results = await Promise.all(
        updates.map(update => 
          this.updatePreference(update.nodeId, update.action, currentState)
        )
      )
      
      const updatedNodes = results.map(result => result.updatedNode)
      const allAffectedNodes = results.flatMap(result => result.affectedSiblings)
      
      console.log('✅ Batch preference update completed')
      return {
        updatedNodes,
        allAffectedNodes
      }
      
    } catch (error) {
      console.error('❌ Failed batch preference update:', error)
      throw new Error(`Failed to batch update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const preferenceService = PreferenceService.getInstance()