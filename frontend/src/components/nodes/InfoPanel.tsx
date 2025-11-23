import { useState, useEffect, useRef } from 'react'
import type { ConceptNode } from '../../types'

interface InfoPanelProps {
  node: ConceptNode
  position: { x: number; y: number }
  onClose: () => void
}

export const InfoPanel = ({ node, position, onClose }: InfoPanelProps) => {
  const [details, setDetails] = useState(node.metadata)
  const [isLoading, setIsLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  
  console.log(`📋 InfoPanel opened for node "${node.label}"`, {
    nodeId: node.id,
    isExplored: node.isExplored,
    preferenceScore: node.preferenceScore,
    metadata: node.metadata,
    childrenCount: node.children.length
  })

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    // Use backend metadata directly instead of mock generation
    console.log(`📋 InfoPanel using backend metadata for "${node.label}"`, {
      hasBackendSummary: !!node.metadata?.summary,
      backendKeywords: node.metadata?.keywords || [],
      backendSources: node.metadata?.sources || []
    })
    
    // Always use the backend metadata directly
    setDetails(node.metadata || {
      summary: `${node.concept} - AI-generated concept`,
      keywords: [],
      sources: []
    })
    setIsLoading(false)
  }, [node.metadata, node.concept])

  // Adjust panel position to stay within viewport (now in screen space)
  const adjustedPosition = {
    x: Math.min(Math.max(16, position.x), window.innerWidth - 336), // Panel width = 320px + 16px margin
    y: Math.max(16, Math.min(position.y, window.innerHeight - 416)) // Panel height ≈ 400px + 16px margin
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-w-sm animate-[fadeIn_0.2s_ease-out]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        width: '320px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {node.label}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Preference Score Indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Relevance:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                node.preferenceScore > 0.3 ? 'bg-green-500' :
                node.preferenceScore < -0.3 ? 'bg-orange-500' : 'bg-gray-400'
              }`}
              style={{ 
                width: `${Math.max(10, (node.preferenceScore + 1) * 50)}%` 
              }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {node.preferenceScore > 0.3 ? 'High' : 
             node.preferenceScore < -0.3 ? 'Low' : 'Unknown'}
          </span>
        </div>

        {/* Backend Data Source Indicator */}
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
          📡 Backend AI Data • Node ID: {node.id.substring(0, 8)}...
        </div>

        {/* Summary */}
        <div className="text-sm text-gray-700 leading-relaxed">
          {details?.summary || `${node.concept} - AI-generated concept from backend`}
        </div>

        {/* Keywords */}
        {details?.keywords && details.keywords.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Key Concepts:</h4>
            <div className="flex flex-wrap gap-1">
              {details.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Backend Sources */}
        {details?.sources && details.sources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Sources:</h4>
            <div className="space-y-1">
              {details.sources.slice(0, 3).map((source, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  📄 {source}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationships */}
        {node.children.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Explored Aspects:</h4>
            <div className="text-sm text-gray-600">
              {node.children.length} sub-concept{node.children.length !== 1 ? 's' : ''} discovered via backend AI
            </div>
          </div>
        )}

        {/* Backend Metadata */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div>🤖 Generated: {node.createdAt.toLocaleDateString()} {node.createdAt.toLocaleTimeString()}</div>
          <div>🎯 Parent: {node.parentId ? node.parentId.substring(0, 8) + '...' : 'Root concept'}</div>
          <div>📊 Score: {node.preferenceScore.toFixed(3)}</div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => console.log('Generate image for:', node.label)}
            className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            🎨 Generate Image
          </button>
          <button
            onClick={() => console.log('Find videos for:', node.label)}
            className="flex-1 px-3 py-2 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            🎥 Find Videos
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 rounded-b-xl">
        <div className="text-xs text-gray-500 text-center">
          Created {node.createdAt.toLocaleDateString()} • 
          {node.isExplored ? ' Explored' : ' Unexplored'}
        </div>
      </div>
    </div>
  )
}

