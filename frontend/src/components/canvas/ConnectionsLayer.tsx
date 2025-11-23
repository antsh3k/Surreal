import { useMemo } from 'react'
import type { ConceptNode } from '../../types'
import './ConnectionsLayer.css'

interface ConnectionsLayerProps {
  nodes: ConceptNode[]
}

interface Connection {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  isExplored: boolean
}

// CRITICAL: node.position IS already the center!
// ConceptNode renders at: left = node.position.x - offset.x
// Button center = (node.position.x - offset.x) + offset.x = node.position.x
// So we use node.position directly - no offset needed!
const getNodeCenter = (node: ConceptNode) => {
  return {
    x: node.position.x,
    y: node.position.y
  }
}

export const ConnectionsLayer = ({ nodes }: ConnectionsLayerProps) => {
  const connections = useMemo(() => {
    const links: Connection[] = []

    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId)
        if (parent) {
          const from = getNodeCenter(parent)
          const to = getNodeCenter(node)
          
          links.push({
            id: `${parent.id}-${node.id}`,
            from,
            to,
            isExplored: node.isExplored
          })
        }
      }
    })

    return links
    // Note: nodesStableKey is calculated above but we use nodes as dependency
    // The stable key calculation ensures we're aware of when data actually changes
  }, [nodes])

  // CRITICAL: Use a stable key based on connection IDs only
  // This prevents SVG from unmounting/remounting when nodes array reference changes
  // but connections themselves haven't changed
  const connectionKey = useMemo(() => {
    if (connections.length === 0) return 'empty'
    return connections.map(c => c.id).sort().join('-')
  }, [connections])

  if (connections.length === 0) return null

  return (
    <svg 
      key={connectionKey}
      className="connections-layer"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'visible'
      }}
    >
      {connections.map(link => {
        // Validate connection points
        if (!link.from || !link.to || 
            typeof link.from.x !== 'number' || typeof link.from.y !== 'number' ||
            typeof link.to.x !== 'number' || typeof link.to.y !== 'number') {
          return null
        }

        const dx = link.to.x - link.from.x
        const dy = link.to.y - link.from.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Handle edge case: if nodes are at same position, draw straight line
        let path: string
        if (distance < 1 || !isFinite(distance)) {
          path = `M ${link.from.x} ${link.from.y} L ${link.to.x} ${link.to.y}`
        } else {
          // Simple curve: just add a small offset for visual appeal
          const curveOffset = Math.min(distance * 0.15, 40)
          const midX = (link.from.x + link.to.x) / 2
          const midY = (link.from.y + link.to.y) / 2
          
          // Perpendicular offset for curve (avoid division by zero)
          const perpX = distance > 0 ? -dy / distance * curveOffset : 0
          const perpY = distance > 0 ? dx / distance * curveOffset : 0
          
          const controlX = midX + perpX
          const controlY = midY + perpY
          
          // Simple quadratic bezier (smoother than straight, simpler than cubic)
          path = `M ${link.from.x} ${link.from.y} Q ${controlX} ${controlY} ${link.to.x} ${link.to.y}`
        }
        
        return (
          <path
            key={link.id}
            d={path}
            fill="none"
            stroke={link.isExplored ? '#3b82f6' : '#9ca3af'}
            strokeWidth={link.isExplored ? 2.5 : 2}
            strokeDasharray={link.isExplored ? 'none' : '6,4'}
            strokeLinecap="round"
            className={link.isExplored ? 'connection-explored' : 'connection-unexplored'}
          />
        )
      })}
    </svg>
  )
}

