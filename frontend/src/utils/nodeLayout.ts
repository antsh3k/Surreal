interface Position {
  x: number
  y: number
}

export function calculateRadialPositions(
  nodeCount: number,
  centerPosition: Position,
  radius: number
): Position[] {
  const positions: Position[] = []
  const angleStep = (2 * Math.PI) / nodeCount
  
  for (let i = 0; i < nodeCount; i++) {
    const angle = i * angleStep - Math.PI / 2 // Start at top
    positions.push({
      x: centerPosition.x + Math.cos(angle) * radius,
      y: centerPosition.y + Math.sin(angle) * radius
    })
  }
  
  return positions
}

export function calculateChildPositions(
  parentPosition: Position,
  childCount: number,
  distance: number
): Position[] {
  const positions: Position[] = []
  
  if (childCount === 1) {
    // Single child directly below parent
    positions.push({
      x: parentPosition.x,
      y: parentPosition.y + distance
    })
  } else {
    // Multiple children in an arc below parent
    const arcAngle = Math.PI / 2 // 90 degree arc
    const startAngle = Math.PI / 2 - arcAngle / 2 // Start angle
    const angleStep = arcAngle / (childCount - 1)
    
    for (let i = 0; i < childCount; i++) {
      const angle = startAngle + i * angleStep
      positions.push({
        x: parentPosition.x + Math.cos(angle) * distance,
        y: parentPosition.y + Math.sin(angle) * distance
      })
    }
  }
  
  return positions
}

export function calculateOptimalSpacing(nodeCount: number, canvasSize: { width: number; height: number }): number {
  // Calculate optimal spacing based on canvas size and node count
  const minSpacing = 120 // Minimum distance between nodes
  const maxSpacing = 250 // Maximum distance for readability
  
  const availableSpace = Math.min(canvasSize.width, canvasSize.height) / 2
  const calculatedSpacing = availableSpace / Math.sqrt(nodeCount)
  
  return Math.max(minSpacing, Math.min(maxSpacing, calculatedSpacing))
}

