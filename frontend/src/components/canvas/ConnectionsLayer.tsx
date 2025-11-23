import { useMemo } from 'react'
import type { ConceptNode } from '../../types'
import {
  getNodeDimensions,
  getEdgePoint,
  calculateCurvePath,
  calculateAngle,
  type Point
} from '../../utils/connectionUtils'
import './ConnectionsLayer.css'

interface ConnectionsLayerProps {
  nodes: ConceptNode[]
}

interface Connection {
  id: string
  start: Point
  end: Point
  parentNode: ConceptNode
  childNode: ConceptNode
  isExplored: boolean
  angle: number
}

export const ConnectionsLayer = ({ nodes }: ConnectionsLayerProps) => {
  const connections = useMemo(() => {
    const links: Connection[] = []

    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId)
        if (parent) {
          // Calculate angle from parent to child
          const angle = calculateAngle(parent.position, node.position)
          
          // Get dimensions for both nodes
          const parentDims = getNodeDimensions(parent)
          const childDims = getNodeDimensions(node)
          
          // Calculate edge intersection points (edge-to-edge, not center-to-center)
          const startPoint = getEdgePoint(parent.position, parentDims, angle)
          const endPoint = getEdgePoint(node.position, childDims, angle + Math.PI)
          
          links.push({
            id: `${parent.id}-${node.id}`,
            start: startPoint,
            end: endPoint,
            parentNode: parent,
            childNode: node,
            isExplored: node.isExplored,
            angle
          })
        }
      }
    })

    return links
  }, [nodes])

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-[5] overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Gradient for explored connections */}
        <linearGradient id="connection-gradient-explored" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
        </linearGradient>
        
        {/* Gradient for unexplored connections */}
        <linearGradient id="connection-gradient-unexplored" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.7" />
        </linearGradient>
        
        {/* Arrowhead for explored connections - solid blue */}
        <marker
          id="arrowhead-explored"
          markerWidth="12"
          markerHeight="8"
          refX="11"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 12 4 L 0 8 Z" fill="#3b82f6" />
        </marker>
        
        {/* Arrowhead for unexplored connections - lighter gray */}
        <marker
          id="arrowhead-unexplored"
          markerWidth="12"
          markerHeight="8"
          refX="11"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 12 4 L 0 8 Z" fill="#94a3b8" />
        </marker>
        
        {/* Glow filter for hover/emphasis effects */}
        <filter id="connection-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {connections.map(link => {
        // Create smooth bezier path using intelligent control points
        const path = calculateCurvePath(
          link.start,
          link.end,
          link.angle,
          link.angle + Math.PI
        )
        
        // Dynamic styling based on node state
        const strokeWidth = link.isExplored ? 2.5 : 2
        const strokeDasharray = link.isExplored ? 'none' : '8,4'
        const markerEnd = link.isExplored ? 'url(#arrowhead-explored)' : 'url(#arrowhead-unexplored)'
        const gradient = link.isExplored ? 'url(#connection-gradient-explored)' : 'url(#connection-gradient-unexplored)'
        const connectionClass = link.isExplored ? 'connection-explored' : 'connection-unexplored'

        return (
          <g key={link.id} className="connection-group">
            {/* Wide invisible hit area for potential future interactions */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="20"
              className="pointer-events-none"
            />
            
            {/* Darker gray shadow/outline for better contrast */}
            <path
              d={path}
              fill="none"
              stroke="#9ca3af"
              strokeWidth={strokeWidth + 2}
              strokeOpacity="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Main connection line with gradient and animations */}
            <path
              d={path}
              fill="none"
              stroke={gradient}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={markerEnd}
              className={`connection-path ${connectionClass}`}
            />
          </g>
        )
      })}
    </svg>
  )
}

