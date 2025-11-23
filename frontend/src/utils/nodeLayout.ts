interface Position {
  x: number
  y: number
}

// Constants for layout
const NODE_SPACING = 140 // Minimum distance between any two nodes
const RING_SPACING = 250 // Distance between rings
const CENTER_POSITION = { x: 600, y: 400 }

// Helper to calculate distance between two points
function getDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Check if a position would collide with existing nodes
function wouldCollide(newPos: Position, existingPositions: Position[], minDistance: number = NODE_SPACING): boolean {
  return existingPositions.some(pos => getDistance(newPos, pos) < minDistance)
}

// Convert polar coordinates (angle, radius) to cartesian (x, y)
function polarToCartesian(centerPos: Position, angle: number, radius: number): Position {
  return {
    x: centerPos.x + Math.cos(angle) * radius,
    y: centerPos.y + Math.sin(angle) * radius
  }
}

// Calculate initial radial positions for 4 nodes around center
export function calculateInitialRadialPositions(
  centerPosition: Position = CENTER_POSITION,
  radius: number = RING_SPACING
): Position[] {
  const positions: Position[] = []
  const nodeCount = 4
  
  // Start at top (12 o'clock) and go clockwise
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i * 2 * Math.PI / nodeCount) - Math.PI / 2 // Start at top
    const position = polarToCartesian(centerPosition, angle, radius)
    positions.push(position)
  }
  
  console.log('🔧 Initial radial positions:', positions)
  return positions
}

// Find the ring (distance from center) where a parent node is located
function getNodeRing(nodePosition: Position, centerPos: Position = CENTER_POSITION): number {
  const distance = getDistance(nodePosition, centerPos)
  return Math.round(distance / RING_SPACING)
}

// Find available angular positions around a parent node
function findAvailableAngles(
  parentPos: Position, 
  childCount: number, 
  existingPositions: Position[], 
  radius: number
): number[] {
  const angles: number[] = []
  const totalAngles = 24 // Check angles every 15 degrees
  const angleStep = (2 * Math.PI) / totalAngles
  const availableAngles: number[] = []
  
  // Check all possible angles
  for (let i = 0; i < totalAngles; i++) {
    const angle = i * angleStep
    const testPos = polarToCartesian(parentPos, angle, radius)
    
    if (!wouldCollide(testPos, existingPositions)) {
      availableAngles.push(angle)
    }
  }
  
  // If we need more positions than available, increase radius
  if (availableAngles.length < childCount) {
    return findAvailableAngles(parentPos, childCount, existingPositions, radius + 50)
  }
  
  // Distribute children evenly among available angles
  const step = Math.floor(availableAngles.length / childCount)
  for (let i = 0; i < childCount; i++) {
    const angleIndex = (i * step) % availableAngles.length
    angles.push(availableAngles[angleIndex])
  }
  
  return angles
}

// Calculate the angle from center to parent to determine preferred growth direction
function getRadialDirection(parentPosition: Position, centerPosition: Position = CENTER_POSITION): number {
  const dx = parentPosition.x - centerPosition.x
  const dy = parentPosition.y - centerPosition.y
  return Math.atan2(dy, dx)
}

// Calculate positions for child nodes using radial with OUTWARD expansion
export function calculateRadialChildPositions(
  parentPosition: Position,
  childCount: number,
  baseRadius: number = RING_SPACING,
  existingPositions: Position[] = []
): Position[] {
  if (childCount === 0) return []
  
  const positions: Position[] = []
  
  // Get the radial direction from center through parent for OUTWARD expansion
  const centerPosition = CENTER_POSITION
  const parentDistanceFromCenter = getDistance(parentPosition, centerPosition)
  const preferredDirection = getRadialDirection(parentPosition, centerPosition)
  
  // Calculate radius for OUTWARD expansion - children should be further from center than parent
  const minOutwardRadius = Math.max(baseRadius, parentDistanceFromCenter + baseRadius * 0.7)
  
  // Try to place children in the preferred radial direction first (OUTWARD)
  const candidateAngles: number[] = []
  
  // Start with the preferred direction and add variations
  for (let i = 0; i < childCount; i++) {
    // Spread children around the preferred direction
    const angleVariation = (i - (childCount - 1) / 2) * (Math.PI / 6) // 30 degree increments
    candidateAngles.push(preferredDirection + angleVariation)
  }
  
  // Try different radii starting from minimum outward radius and find positions that don't collide
  for (let radiusMultiplier = 1; radiusMultiplier <= 3; radiusMultiplier++) {
    const radius = minOutwardRadius * radiusMultiplier
    positions.length = 0 // Reset positions
    
    for (let i = 0; i < childCount; i++) {
      let bestAngle = candidateAngles[i]
      let bestPosition = polarToCartesian(parentPosition, bestAngle, radius)
      
      // If this position would collide, try to find a better angle
      if (wouldCollide(bestPosition, [...existingPositions, ...positions])) {
        let foundBetter = false
        
        // Try angles in a wider search around the preferred direction
        for (let searchRadius = Math.PI / 8; searchRadius <= Math.PI && !foundBetter; searchRadius += Math.PI / 8) {
          for (const direction of [-1, 1]) { // Try both sides
            const testAngle = preferredDirection + (direction * searchRadius)
            const testPosition = polarToCartesian(parentPosition, testAngle, radius)
            
            if (!wouldCollide(testPosition, [...existingPositions, ...positions])) {
              bestAngle = testAngle
              bestPosition = testPosition
              foundBetter = true
              break
            }
          }
        }
      }
      
      positions.push(bestPosition)
    }
    
    // If all positions are valid at this radius, we're done
    const allValid = positions.every(pos => 
      !wouldCollide(pos, existingPositions, NODE_SPACING)
    )
    
    if (allValid) break
  }
  
  // Fallback: If still having issues, use emergency spacing with OUTWARD guarantee
  if (positions.some(pos => wouldCollide(pos, existingPositions))) {
    positions.length = 0
    for (let i = 0; i < childCount; i++) {
      // Use a much larger radius as emergency fallback, ensuring it's still outward
      const emergencyRadius = Math.max(minOutwardRadius * 2, baseRadius * 4)
      const angle = preferredDirection + (i - (childCount - 1) / 2) * (Math.PI / 4)
      positions.push(polarToCartesian(parentPosition, angle, emergencyRadius))
    }
  }
  
  console.log(`🌱 OUTWARD Radial expansion: ${childCount} nodes from parent at (${parentPosition.x}, ${parentPosition.y})`)
  console.log(`📏 Parent distance from center: ${parentDistanceFromCenter.toFixed(1)}px`)
  console.log(`🧭 Preferred direction: ${(preferredDirection * 180 / Math.PI).toFixed(1)}°`)
  console.log(`📍 Child positions:`, positions)
  
  return positions
}

// Legacy compatibility functions (kept for any remaining references)
export function getNodeDirection(
  nodePosition: Position,
  centerPosition: Position
): 'top' | 'bottom' | 'left' | 'right' | 'center' {
  const dx = nodePosition.x - centerPosition.x
  const dy = nodePosition.y - centerPosition.y
  
  if (Math.abs(dy) > Math.abs(dx)) {
    return dy < 0 ? 'top' : 'bottom'
  } else if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right'
  }
  return 'center'
}

export function calculateOptimalSpacing(nodeCount: number, canvasSize: { width: number; height: number }): number {
  const minSpacing = 150
  const maxSpacing = 300 
  
  const availableSpace = Math.min(canvasSize.width, canvasSize.height) / 2
  const calculatedSpacing = availableSpace / Math.sqrt(nodeCount)
  
  return Math.max(minSpacing, Math.min(maxSpacing, calculatedSpacing))
}