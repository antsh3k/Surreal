import { PureCanvas } from './PureCanvas'

export const PureCanvasDemo = () => {
  const handleBackgroundClick = () => {
    console.log('Background clicked - could trigger new topic input or other actions')
  }

  return (
    <div className="w-full h-screen">
      <PureCanvas onBackgroundClick={handleBackgroundClick} />
      
      {/* Demo info overlay */}
      <div className="absolute top-6 left-6 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <h3 className="font-semibold text-gray-900 mb-2">Pure Canvas Demo</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• <strong>Pan:</strong> Click & drag background</p>
          <p>• <strong>Zoom:</strong> Scroll wheel</p>
          <p>• <strong>Expand:</strong> Click dashed nodes</p>
          <p>• <strong>Actions:</strong> Right-click nodes</p>
          <p>• <strong>Controls:</strong> Bottom right corner</p>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Clean React + Framer Motion implementation without tldraw.
        </div>
        <div className="mt-2 text-xs text-blue-600 font-mono">
          Try the zoom controls → or scroll wheel over canvas
        </div>
      </div>
    </div>
  )
}