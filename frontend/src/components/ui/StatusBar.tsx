interface StatusBarProps {
  nodeCount: number
  isGenerating: boolean
  centerConcept: string
}

export const StatusBar = ({ nodeCount, isGenerating, centerConcept }: StatusBarProps) => {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-2 shadow-lg z-[60]">
      <div className="flex items-center space-x-4 text-sm">
        {/* Center Concept */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="font-medium text-gray-900 truncate max-w-32">
            {centerConcept}
          </span>
        </div>

        {/* Node Count */}
        <div className="flex items-center space-x-1 text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{nodeCount} concepts</span>
        </div>

        {/* Generation Status */}
        {isGenerating && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span>Generating...</span>
          </div>
        )}

        {/* Help */}
        <div className="text-xs text-gray-500 hidden sm:block">
          Dashed = unexplored • Solid = explored
        </div>
      </div>
    </div>
  )
}

