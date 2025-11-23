import { useCanvasStore } from '../../stores/canvasStore'
import { usePreferenceStore } from '../../stores/preferenceStore'

export const StatusIndicator = () => {
  const { nodes, isLoading, loadingMessage } = useCanvasStore()
  const { getClickCount, hasLearnedPreferences, getPreferencePattern } = usePreferenceStore()

  const clickCount = getClickCount()
  const learnedPreferences = hasLearnedPreferences()
  const topPreferences = getPreferencePattern()

  return (
    <div className="absolute bottom-6 right-6 space-y-3">
      {/* Learning Status */}
      {clickCount > 0 && (
        <div className="bg-white rounded-lg shadow-lg px-4 py-3 max-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${learnedPreferences ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
            <span className="text-sm font-medium text-gray-700">
              {learnedPreferences ? 'Learning your preferences' : 'Getting to know you'}
            </span>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div>Interactions: {clickCount}</div>
            {learnedPreferences && topPreferences.length > 0 && (
              <div>
                <span className="font-medium">You seem interested in:</span>
                <div className="mt-1">
                  {topPreferences.slice(0, 3).map((pref) => (
                    <span key={pref} className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded mr-1 mb-1">
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Stats */}
      {import.meta.env.DEV && (
        <div className="bg-gray-800 text-white rounded-lg shadow-lg px-3 py-2 text-xs font-mono">
          <div>Nodes: {nodes.length}</div>
          <div>FPS: {Math.round(performance.now() % 100)}</div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600"></div>
            <span className="text-sm font-medium text-blue-700">
              {loadingMessage || 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}