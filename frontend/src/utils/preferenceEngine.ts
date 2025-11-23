export function updatePreferenceScore(
  currentScore: number,
  action: 'click' | 'hover' | 'expand'
): number {
  let delta = 0
  
  switch (action) {
    case 'hover':
      delta = 0.02 // Small increase for interest
      break
    case 'click':
      delta = 0.1 // Moderate increase for engagement
      break
    case 'expand':
      delta = 0.2 // Large increase for exploration
      break
  }
  
  // Apply delta with diminishing returns
  const newScore = currentScore + delta * (1 - Math.abs(currentScore))
  
  // Clamp to [-1, 1] range
  return Math.max(-1, Math.min(1, newScore))
}

export function calculateNodeRelevance(
  nodeA: { concept: string; keywords?: string[] },
  nodeB: { concept: string; keywords?: string[] }
): number {
  // Simple keyword overlap calculation
  const wordsA = nodeA.concept.toLowerCase().split(' ')
  const wordsB = nodeB.concept.toLowerCase().split(' ')
  
  const overlap = wordsA.filter(word => wordsB.includes(word)).length
  const totalWords = new Set([...wordsA, ...wordsB]).size
  
  return overlap / totalWords
}

export function propagatePreferenceUpdates(
  targetNodeId: string,
  nodes: Array<{ id: string; parentId?: string; children: string[]; preferenceScore: number }>,
  preferenceChange: number
): Array<{ id: string; newScore: number }> {
  const updates: Array<{ id: string; newScore: number }> = []
  const targetNode = nodes.find(n => n.id === targetNodeId)
  
  if (!targetNode) return updates
  
  // Update parent node (smaller effect)
  if (targetNode.parentId) {
    const parent = nodes.find(n => n.id === targetNode.parentId)
    if (parent) {
      const parentDelta = preferenceChange * 0.3 // 30% of the change
      updates.push({
        id: parent.id,
        newScore: Math.max(-1, Math.min(1, parent.preferenceScore + parentDelta))
      })
    }
  }
  
  // Update sibling nodes (small effect)
  if (targetNode.parentId) {
    const siblings = nodes.filter(n => 
      n.parentId === targetNode.parentId && n.id !== targetNodeId
    )
    
    siblings.forEach(sibling => {
      const siblingDelta = preferenceChange * 0.1 // 10% of the change
      updates.push({
        id: sibling.id,
        newScore: Math.max(-1, Math.min(1, sibling.preferenceScore + siblingDelta))
      })
    })
  }
  
  return updates
}

