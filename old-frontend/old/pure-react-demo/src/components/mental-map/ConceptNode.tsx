import { useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { ConceptNode as ConceptNodeType, Position } from '../../types'

interface ConceptNodeProps {
  node: ConceptNodeType
  position: Position
  onNodeClick: (nodeId: string) => void
  onContextMenu: (nodeId: string, position: Position) => void
}

const ConceptNode = ({ node, position, onNodeClick, onContextMenu }: ConceptNodeProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (node.isUncertain) {
      onNodeClick(node.id)
    }
  }

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu(node.id, { x: e.clientX, y: e.clientY })
  }

  const getNodeStyles = () => {
    if (node.preferenceScore > 0.3) {
      return {
        fill: '#F0FDF4',
        stroke: '#10B981',
        strokeWidth: 2,
        className: 'text-green-600'
      }
    } else if (node.preferenceScore < -0.3) {
      return {
        fill: '#FEF3C7',
        stroke: '#F59E0B', 
        strokeWidth: 2,
        className: 'text-orange-600'
      }
    } else if (node.isUncertain) {
      return {
        fill: '#FFFFFF',
        stroke: '#9CA3AF',
        strokeWidth: 2,
        strokeDasharray: '5,5',
        className: 'text-gray-500'
      }
    }
    
    return {
      fill: '#FFFFFF',
      stroke: '#E5E5E5',
      strokeWidth: 1,
      className: 'text-gray-900'
    }
  }

  const styles = getNodeStyles()
  const nodeWidth = 140
  const nodeHeight = 50

  return (
    <motion.g
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      transform={`translate(${position.x - nodeWidth/2}, ${position.y - nodeHeight/2})`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      {/* Node background with preference glow */}
      <motion.rect
        width={nodeWidth}
        height={nodeHeight}
        rx="8"
        ry="8"
        fill={styles.fill}
        stroke={styles.stroke}
        strokeWidth={styles.strokeWidth}
        strokeDasharray={styles.strokeDasharray}
        animate={{
          filter: node.preferenceScore > 0.5 && isHovered 
            ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' 
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Node text */}
      <text
        x={nodeWidth / 2}
        y={nodeHeight / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className={clsx(
          'text-sm font-medium pointer-events-none',
          styles.className
        )}
        fill="currentColor"
      >
        <tspan x={nodeWidth / 2} dy="0">
          {node.label.length > 18 
            ? `${node.label.slice(0, 15)}...` 
            : node.label
          }
        </tspan>
        
        {/* Uncertain indicator */}
        {node.isUncertain && (
          <tspan x={nodeWidth / 2} dy="12" className="text-xs opacity-70">
            Click to explore
          </tspan>
        )}
        
        {/* Preference indicator */}
        {node.preferenceScore > 0.5 && (
          <tspan x={nodeWidth / 2} dy="12" className="text-xs">
            ✨ Likely interesting
          </tspan>
        )}
      </text>

      {/* Loading indicator */}
      {node.isLoading && (
        <motion.circle
          cx={nodeWidth - 15}
          cy={15}
          r="8"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="15 5"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.g>
  )
}

export default ConceptNode