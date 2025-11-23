import { useState, useEffect } from 'react'
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
  const [animationPhase, setAnimationPhase] = useState(0)
  const [mediaDimensions, setMediaDimensions] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4)
    }, 300)
    return () => clearInterval(interval)
  }, [isLoading])

  // Load media dimensions when node changes
  useEffect(() => {
    if (node.contentType === 'image' && node.contentUrl) {
      const img = new Image()
      img.onload = () => {
        const maxWidth = 180
        const maxHeight = 120
        const aspectRatio = img.naturalWidth / img.naturalHeight
        
        let width = img.naturalWidth
        let height = img.naturalHeight
        
        // Scale down if too large, maintaining aspect ratio
        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }
        
        setMediaDimensions({ width: Math.round(width), height: Math.round(height) })
      }
      img.src = node.contentUrl
    } else if (node.contentType === 'video' && node.contentUrl) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        const maxWidth = 150
        const maxHeight = 150
        const aspectRatio = video.videoWidth / video.videoHeight
        
        let width = video.videoWidth
        let height = video.videoHeight
        
        // Scale down if too large, maintaining aspect ratio
        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }
        
        setMediaDimensions({ width: Math.round(width), height: Math.round(height) })
      }
      video.src = node.contentUrl
    }
  }, [node.contentType, node.contentUrl])
  
  // Simplified node styling - only solid vs dashed border
  const getNodeClasses = () => {
    const isCenterNode = node.id === 'center'
    const isMediaNode = node.contentType === 'image' || node.contentType === 'video'
    
    if (isCenterNode) {
      // Center node is larger and has distinct styling
      return `
        px-6 py-4 rounded-xl border-3 bg-blue-50 shadow-lg transition-all duration-200 ease-out
        border-blue-600 border-solid text-lg font-semibold
        ${className}
      `
    }
    
    if (isMediaNode) {
      // Media nodes have dynamic size based on aspect ratio, black border, no padding
      return `
        rounded-lg border-2 border-black border-solid bg-white shadow-sm transition-all duration-200 ease-out
        overflow-hidden p-0
        ${className}
      `
    }
    
    const baseClasses = `
      px-4 py-3 rounded-lg border-2 bg-white shadow-sm transition-all duration-200 ease-out
      ${className}
    `
    
    if (isLoading) {
      return `${baseClasses} border-blue-400 border-solid`
    }
    
    if (node.isExplored) {
      return `${baseClasses} border-gray-800 border-solid`
    } else {
      return `${baseClasses} border-gray-400 border-dashed`
    }
  }

  const handleClick = () => {
    if (!isLoading) {
      onClick(node.id)
    }
  }

  const handleMouseEnter = () => {
    onHover?.(node.id, true)
  }

  const handleMouseLeave = () => {
    onHover?.(node.id, false)
  }

  const renderContent = () => (
    <div className="relative z-10 min-w-[120px] text-center">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-1">
          <span className="text-sm font-medium text-blue-600">Thinking</span>
          <div className="flex justify-center space-x-1 mt-1">
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                className={`
                  w-1 h-1 bg-blue-500 rounded-full transition-opacity duration-300
                  ${animationPhase === dot ? 'opacity-100' : 'opacity-30'}
                `}
              />
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Media-only content for image/video nodes */}
          {node.contentType === 'image' && node.contentUrl ? (
            <img 
              src={node.contentUrl} 
              alt={node.label}
              className="object-cover rounded-lg"
              style={{
                width: mediaDimensions?.width || 128,
                height: mediaDimensions?.height || 128
              }}
              onError={(e) => {
                console.warn(`Failed to load image: ${node.contentUrl}`)
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : node.contentType === 'video' && node.contentUrl ? (
            <video 
              src={node.contentUrl} 
              className="object-cover rounded-lg"
              style={{
                width: mediaDimensions?.width || 128,
                height: mediaDimensions?.height || 128
              }}
              muted
              onError={(e) => {
                console.warn(`Failed to load video: ${node.contentUrl}`)
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            /* Text content for regular nodes - use CONCEPT not label */
            <div>
              <span className={`text-sm font-medium ${node.id === 'center' ? 'text-blue-600' : 'text-gray-900'}`}>
                {node.concept.length > 35 ? `${node.concept.slice(0, 32)}...` : node.concept}
              </span>
              
              {/* Simple state indicator - hide for center node */}
              {!node.isExplored && node.id !== 'center' && (
                <div className="text-xs text-gray-500 mt-1">Click to explore</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const isCenterNode = node.id === 'center'
  const isMediaNode = node.contentType === 'image' || node.contentType === 'video'
  
  // Calculate offset for centering different node types
  const getNodeOffset = () => {
    if (isCenterNode) return { x: 90, y: 25 }
    if (isMediaNode && mediaDimensions) {
      return { x: mediaDimensions.width / 2, y: mediaDimensions.height / 2 }
    }
    if (isMediaNode) return { x: 64, y: 64 } // Fallback for media nodes before dimensions load
    return { x: 90, y: 25 } // Increased to accommodate longer concept text
  }

  const offset = getNodeOffset()
  
  return (
    <div 
      className="absolute z-[15] pointer-events-none"
      style={{ 
        left: node.position.x - offset.x, // Center horizontally
        top: node.position.y - offset.y,  // Center vertically
        transform: 'translate(0, 0)',
        transition: 'transform 0.2s ease-out'
      }}
    >
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isLoading}
        className={`
          ${getNodeClasses()}
          ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
          hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:cursor-not-allowed
          pointer-events-auto
        `}
        style={isMediaNode && mediaDimensions ? {
          width: mediaDimensions.width,
          height: mediaDimensions.height
        } : undefined}
      >
        {renderContent()}
      </button>
    </div>
  )
}
