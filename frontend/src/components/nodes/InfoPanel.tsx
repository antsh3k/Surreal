import { useEffect, useRef } from 'react'
import type { ConceptNode } from '../../types'

interface InfoPanelProps {
  node: ConceptNode
  position: { x: number; y: number }
  onClose: () => void
}

export const InfoPanel = ({ node, position, onClose }: InfoPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  
  // Use node.metadata directly instead of storing in state
  const details = node.metadata || {
    summary: `${node.concept} - AI-generated concept`,
    keywords: [],
    sources: []
  }
  
  console.log(`📋 InfoPanel opened for node "${node.concept}"`, {
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
    // Log backend metadata usage
    console.log(`📋 InfoPanel using backend metadata for "${node.concept}"`, {
      hasBackendSummary: !!node.metadata?.summary,
      backendKeywords: node.metadata?.keywords || [],
      backendSources: node.metadata?.sources || []
    })
  }, [node.metadata, node.concept])

  // Adjust panel position to stay within viewport (now in screen space)
  const adjustedPosition = {
    x: Math.min(Math.max(16, position.x), window.innerWidth - 376), // Panel width = 360px + 16px margin
    y: Math.max(16, Math.min(position.y, window.innerHeight - 500)) // Panel height ≈ 500px + 16px margin
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-w-sm animate-[fadeIn_0.2s_ease-out]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        width: '360px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 break-words pr-2">
          {node.concept}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Summary - Prominently displayed at top */}
        {details?.summary && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Summary</h4>
            <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
              {details.summary}
            </div>
          </div>
        )}

        {/* Uncertainty Score - Display after Summary */}
        {details?.uncertainty_score !== undefined && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Uncertainty</h4>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    details.uncertainty_score < 0.3 ? 'bg-green-500' :
                    details.uncertainty_score < 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, details.uncertainty_score * 100)}%` 
                  }}
                />
              </div>
              <span className={`text-xs font-medium ${
                details.uncertainty_score < 0.3 ? 'text-green-700' :
                details.uncertainty_score < 0.7 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {details.uncertainty_score.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {details.uncertainty_score < 0.3 ? 'Low uncertainty' :
               details.uncertainty_score < 0.7 ? 'Moderate uncertainty' : 'High uncertainty'}
            </div>
          </div>
        )}

        {/* Keywords - Prominently displayed */}
        {details?.keywords && details.keywords.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {details.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sources - All sources as clickable links */}
        {details?.sources && details.sources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Sources</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {details.sources.map((source, index) => (
                <a
                  key={index}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-600 hover:text-blue-800 bg-gray-50 hover:bg-blue-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors break-all"
                >
                  <span className="inline-block mr-2">📄</span>
                  {source}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

