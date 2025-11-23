import { useEffect, useRef } from 'react'

interface NodeActionMenuProps {
  nodeId: string
  position: { x: number; y: number }
  onAction: (action: 'generate-nodes' | 'create-image' | 'create-video') => void
  onClose: () => void
  isVisible: boolean
}

export const NodeActionMenu = ({ 
  nodeId, 
  position, 
  onAction, 
  onClose, 
  isVisible 
}: NodeActionMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const handleAction = (action: 'generate-nodes' | 'create-image' | 'create-video') => {
    onAction(action)
    onClose()
  }

  // Smart positioning logic - place menu near node like an arrow tooltip
  const calculateOptimalPosition = () => {
    const menuWidth = 180
    const menuHeight = 140
    const padding = 20
    const arrowOffset = 40 // Position menu like arrow from node
    
    // Try to position menu to the right of the node first
    let x = position.x + arrowOffset
    let y = position.y - menuHeight / 2
    
    // If menu would go off right edge, position to the left
    if (x + menuWidth + padding > window.innerWidth) {
      x = position.x - arrowOffset - menuWidth
    }
    
    // If menu would go off left edge, center horizontally
    if (x < padding) {
      x = position.x - menuWidth / 2
    }
    
    // Adjust vertical position if needed
    if (y < padding) {
      y = padding
    } else if (y + menuHeight + padding > window.innerHeight) {
      y = window.innerHeight - menuHeight - padding
    }
    
    return { x: Math.max(padding, x), y: Math.max(padding, y) }
  }
  
  const adjustedPosition = calculateOptimalPosition()

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 p-3 backdrop-blur-sm bg-opacity-95"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        animation: 'fadeIn 0.2s ease-out',
        transform: 'translateZ(0)' // Force hardware acceleration
      }}
    >
      <div className="flex flex-col space-y-2 min-w-[160px]">
        <button
          onClick={() => handleAction('generate-nodes')}
          className="flex items-center space-x-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors duration-150 group"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-800">Generate Nodes</span>
        </button>

        <button
          onClick={() => handleAction('create-image')}
          className="flex items-center space-x-3 p-3 text-left hover:bg-green-50 rounded-lg transition-colors duration-150 group"
        >
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-800">Create Image</span>
        </button>

        <button
          onClick={() => handleAction('create-video')}
          className="flex items-center space-x-3 p-3 text-left hover:bg-purple-50 rounded-lg transition-colors duration-150 group"
        >
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-800">Create Video</span>
        </button>
      </div>
    </div>
  )
}