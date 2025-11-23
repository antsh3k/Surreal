import { useRef, useEffect } from 'react'
import { Line } from 'react-konva'
import Konva from 'konva'
import type { ConnectionData, ConceptNodeData } from '../../types'
import { useCanvasAnimations } from '../../hooks/useCanvasAnimations'

interface ConnectionLayerProps {
  connections: ConnectionData[]
  nodes: ConceptNodeData[]
}

export const ConnectionLayer = ({ connections, nodes }: ConnectionLayerProps) => {
  const { animateConnectionDraw } = useCanvasAnimations()
  
  // Create a map of node positions for quick lookup
  const nodePositions = new Map(
    nodes.map(node => [
      node.id, 
      { 
        x: node.position.x + node.size.width / 2, 
        y: node.position.y + node.size.height / 2,
        width: node.size.width,
        height: node.size.height
      }
    ])
  )

  const getConnectionPoints = (connection: ConnectionData) => {
    const fromNode = nodePositions.get(connection.fromNodeId)
    const toNode = nodePositions.get(connection.toNodeId)
    
    if (!fromNode || !toNode) return null
    
    // Calculate edge points instead of center points for cleaner connections
    const dx = toNode.x - fromNode.x
    const dy = toNode.y - fromNode.y
    const angle = Math.atan2(dy, dx)
    
    // Start point (edge of from node)
    const fromX = fromNode.x + Math.cos(angle) * (fromNode.width / 2)
    const fromY = fromNode.y + Math.sin(angle) * (fromNode.height / 2)
    
    // End point (edge of to node)
    const toX = toNode.x - Math.cos(angle) * (toNode.width / 2)
    const toY = toNode.y - Math.sin(angle) * (toNode.height / 2)
    
    // Create curved path for more organic feel
    const controlOffset = Math.min(100, Math.abs(dx) * 0.3, Math.abs(dy) * 0.3)
    const control1X = fromX + Math.cos(angle - 0.5) * controlOffset
    const control1Y = fromY + Math.sin(angle - 0.5) * controlOffset
    const control2X = toX - Math.cos(angle + 0.5) * controlOffset
    const control2Y = toY - Math.sin(angle + 0.5) * controlOffset
    
    return {
      points: [fromX, fromY, control1X, control1Y, control2X, control2Y, toX, toY],
      straight: [fromX, fromY, toX, toY] // For simple straight lines if preferred
    }
  }
  
  const getConnectionStyle = (connection: ConnectionData) => {
    const baseStyle = {
      strokeWidth: 2,
      opacity: 0.6,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    }
    
    switch (connection.type) {
      case 'parent-child':
        return {
          ...baseStyle,
          stroke: '#6B7280',
          opacity: 0.8,
        }
      case 'related':
        return {
          ...baseStyle,
          stroke: '#10B981',
          dash: [4, 4],
        }
      case 'generated':
        return {
          ...baseStyle,
          stroke: '#F59E0B',
          strokeWidth: 1.5,
        }
      default:
        return {
          ...baseStyle,
          stroke: '#E5E5E5',
        }
    }
  }

  return (
    <>
      {connections.map(connection => {
        const connectionPoints = getConnectionPoints(connection)
        if (!connectionPoints) return null
        
        const style = getConnectionStyle(connection)
        
        return (
          <ConnectionLine
            key={connection.id}
            points={connectionPoints.straight} // Use straight lines for performance
            style={style}
            onMount={(line) => animateConnectionDraw(line)}
          />
        )
      })}
    </>
  )
}

// Individual connection line component for better performance
interface ConnectionLineProps {
  points: number[]
  style: any
  onMount: (line: Konva.Line) => void
}

const ConnectionLine = ({ points, style, onMount }: ConnectionLineProps) => {
  const lineRef = useRef<Konva.Line>(null)
  
  useEffect(() => {
    if (lineRef.current) {
      onMount(lineRef.current)
    }
  }, [onMount])
  
  return (
    <Line
      ref={lineRef}
      points={points}
      {...style}
    />
  )
}