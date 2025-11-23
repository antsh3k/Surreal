import { useState } from 'react'
import StarBorder from '../ui/StarBorder'
import { ShinyText } from '../ui/ShinyText'
import type { ConceptNode as ConceptNodeType } from '../../types'

interface ConceptNodeProps {
  node: ConceptNodeType
  onClick: (nodeId: string) => void
  onHover?: (nodeId: string, isHovered: boolean) => void
  isLoading?: boolean
  className?: string
}

export const ConceptNode = ({
  node,
  onClick,
  onHover,
  isLoading = false,
  className = ''
}: ConceptNodeProps) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // Determine node styling based on state
  const getNodeClasses = () => {
    const baseClasses = `concept-node ${className}`
    
    if (isLoading) return `${baseClasses} opacity-75`
    
    if (node.isExplored) {
      if (node.preferenceScore > 0.3) {
        return `${baseClasses} concept-node-explored concept-node-preferred`
      }
      return `${baseClasses} concept-node-explored`
    } else {
      if (node.preferenceScore < -0.3) {
        return `${baseClasses} concept-node-unexplored concept-node-uncertain`
      }
      return `${baseClasses} concept-node-unexplored`
    }
  }

  // Determine if we should show special effects
  const showStarBorder = node.preferenceScore > 0.7 && !isLoading
  const showShinyText = node.preferenceScore > 0.5 && node.isExplored && !isLoading
  const showImportanceIndicator = node.preferenceScore > 0.3

  const handleClick = () => {
    if (!isLoading) {
      onClick(node.id)
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(node.id, true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(node.id, false)
  }

  return (
    <div 
      className="absolute z-10"
      style={{ 
        left: node.position.x - 70, // Center horizontally
        top: node.position.y - 20,  // Center vertically
        transform: 'translate(0, 0)',
        transition: 'transform 0.2s ease-out'
      }}
    >
      <div className="relative">
        {showStarBorder ? (
          <StarBorder 
            color={node.preferenceScore > 0.8 ? "gold" : "green"}
            thickness={1} 
            speed={node.preferenceScore > 0.8 ? "1s" : "2s"}
            as="button"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            disabled={isLoading}
            className={`
              ${isHovered && !isLoading ? 'scale-105' : 'scale-100'}
              ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
              hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:cursor-not-allowed
            `}
          >
            {/* Node Content */}
            <div className="relative z-10 min-w-[120px] text-center">
              {showShinyText ? (
                <ShinyText text={node.label} />
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {node.label.length > 20 ? `${node.label.slice(0, 17)}...` : node.label}
                </span>
              )}
              
              {/* State Indicators */}
              <div className="flex items-center justify-center mt-1 space-x-1">
                {!node.isExplored && (
                  <span className="text-xs text-gray-500">Click to explore</span>
                )}
                
                {showImportanceIndicator && node.isExplored && (
                  <span className="text-xs text-green-600">✨</span>
                )}
                
                {node.preferenceScore < -0.3 && (
                  <span className="text-xs text-orange-600">?</span>
                )}
              </div>
            </div>
          </StarBorder>
        ) : (
          <button
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={isLoading}
          className={`
            ${getNodeClasses()}
            ${isHovered && !isLoading ? 'scale-105' : 'scale-100'}
            ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
            hover:shadow-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed
          `}
        >
          {/* Node Content */}
          <div className="relative z-10 min-w-[120px] text-center">
            {showShinyText ? (
              <ShinyText text={node.label} />
            ) : (
              <span className="text-sm font-medium text-gray-900">
                {node.label.length > 20 ? `${node.label.slice(0, 17)}...` : node.label}
              </span>
            )}
            
            {/* State Indicators */}
            <div className="flex items-center justify-center mt-1 space-x-1">
              {!node.isExplored && (
                <span className="text-xs text-gray-500">Click to explore</span>
              )}
              
              {showImportanceIndicator && node.isExplored && (
                <span className="text-xs text-green-600">✨</span>
              )}
              
              {node.preferenceScore < -0.3 && (
                <span className="text-xs text-orange-600">?</span>
              )}
            </div>
          </div>
          </button>
        )}

        {/* Preference Score Debug (remove in production) */}
        {import.meta.env.DEV && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
            {node.preferenceScore.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}

