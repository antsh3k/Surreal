import type { ConceptNode } from '../types'

/**
 * Utility functions for calculating smart connection paths between nodes
 */

export interface NodeDimensions {
  width: number
  height: number
  radiusX: number
  radiusY: number
}

export interface Point {
  x: number
  y: number
}

/**
 * Calculate node dimensions based on node type
 */
export const getNodeDimensions = (node: ConceptNode): NodeDimensions => {
  const isCenterNode = node.id === 'center'
  const isMediaNode = node.contentType === 'image' || node.contentType === 'video'
  
  if (isCenterNode) {
    return { width: 180, height: 50, radiusX: 90, radiusY: 25 }
  }
  if (isMediaNode) {
    return { width: 128, height: 128, radiusX: 64, radiusY: 64 }
  }
  // Regular nodes - wider to accommodate concept text
  return { width: 180, height: 50, radiusX: 90, radiusY: 25 }
}

/**
 * Calculate intersection point on ellipse edge
 * Uses parametric ellipse equation for smooth edge detection
 */
export const getEdgePoint = (
  nodePos: Point,
  dimensions: NodeDimensions,
  angle: number,
  offset: number = 8 // Stop 8px before the edge for visibility
): Point => {
  const a = dimensions.radiusX
  const b = dimensions.radiusY
  
  const cosAngle = Math.cos(angle)
  const sinAngle = Math.sin(angle)
  
  // Distance from center to edge at this angle
  const distance = (a * b) / Math.sqrt((b * cosAngle) ** 2 + (a * sinAngle) ** 2)
  
  // Reduce distance by offset to stop before the edge
  const adjustedDistance = Math.max(0, distance - offset)
  
  return {
    x: nodePos.x + cosAngle * adjustedDistance,
    y: nodePos.y + sinAngle * adjustedDistance
  }
}

/**
 * Calculate smooth cubic bezier curve path
 * with intelligent control points based on distance and angle
 */
export const calculateCurvePath = (
  start: Point,
  end: Point,
  startAngle: number,
  endAngle: number
): string => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Adaptive control point distance based on connection length
  // Shorter connections = tighter curves, longer = more gentle
  const cpDistance = Math.min(distance * 0.35, 150)
  
  // Control points extend from edge in the direction of the angle
  const cp1 = {
    x: start.x + Math.cos(startAngle) * cpDistance,
    y: start.y + Math.sin(startAngle) * cpDistance
  }
  
  const cp2 = {
    x: end.x - Math.cos(endAngle) * cpDistance,
    y: end.y - Math.sin(endAngle) * cpDistance
  }
  
  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`
}

/**
 * Calculate angle between two points
 */
export const calculateAngle = (from: Point, to: Point): number => {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

/**
 * Calculate distance between two points
 */
export const calculateDistance = (from: Point, to: Point): number => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Detect if a point is near a connection path (for hover detection)
 */
export const isPointNearPath = (
  point: Point,
  start: Point,
  end: Point,
  threshold: number = 10
): boolean => {
  // Use point-to-line-segment distance algorithm
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  
  if (lengthSquared === 0) return false
  
  const t = Math.max(0, Math.min(1, 
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
  ))
  
  const projectionX = start.x + t * dx
  const projectionY = start.y + t * dy
  
  const distance = Math.sqrt(
    (point.x - projectionX) ** 2 + (point.y - projectionY) ** 2
  )
  
  return distance <= threshold
}

