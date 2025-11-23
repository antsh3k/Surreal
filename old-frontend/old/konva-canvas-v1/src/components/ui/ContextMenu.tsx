import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../../stores/canvasStore'

interface ContextMenuProps {
  onClose: () => void
}

interface ContextMenuAction {
  id: string
  icon: string
  label: string
  description: string
  action: () => Promise<void> | void
}

export const ContextMenu = ({ onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const { contextMenu, generateContent } = useCanvasStore()
  
  if (!contextMenu?.visible) return null

  const actions: ContextMenuAction[] = [
    {
      id: 'generate-diagram',
      icon: '🎨',
      label: 'Generate Diagram',
      description: 'Create visual representation',
      action: async () => {
        await generateContent(contextMenu.nodeId, 'diagram')
        onClose()
      }
    },
    {
      id: 'create-summary',
      icon: '📄',
      label: 'Create Summary',
      description: 'Generate text summary',
      action: async () => {
        await generateContent(contextMenu.nodeId, 'summary')
        onClose()
      }
    },
    {
      id: 'find-video',
      icon: '📹',
      label: 'Find Video',
      description: 'Search for related videos',
      action: async () => {
        await generateContent(contextMenu.nodeId, 'video')
        onClose()
      }
    },
    {
      id: 'separator-1',
      icon: '',
      label: '',
      description: '',
      action: () => {}
    },
    {
      id: 'pin-node',
      icon: '📌',
      label: 'Pin to Top',
      description: 'Keep this concept visible',
      action: () => {
        // TODO: Implement pinning functionality
        console.log('Pin node:', contextMenu.nodeId)
        onClose()
      }
    },
    {
      id: 'export-node',
      icon: '📤',
      label: 'Export Node',
      description: 'Save this concept',
      action: () => {
        // TODO: Implement node export
        console.log('Export node:', contextMenu.nodeId)
        onClose()
      }
    },
    {
      id: 'remove-branch',
      icon: '🗑️',
      label: 'Remove Branch',
      description: 'Delete this and child nodes',
      action: () => {
        useCanvasStore.getState().removeNode(contextMenu.nodeId)
        onClose()
      }
    }
  ]

  // Position menu to avoid screen edges
  const getMenuPosition = () => {
    const { position } = contextMenu
    const menuWidth = 280
    const menuHeight = actions.length * 50 + 16 // Approximate
    
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    let x = position.x
    let y = position.y
    
    // Adjust horizontal position
    if (x + menuWidth > windowWidth - 20) {
      x = windowWidth - menuWidth - 20
    }
    
    // Adjust vertical position  
    if (y + menuHeight > windowHeight - 20) {
      y = windowHeight - menuHeight - 20
    }
    
    return { x: Math.max(20, x), y: Math.max(20, y) }
  }

  const menuPosition = getMenuPosition()

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[280px] animate-in slide-in-from-top-1 duration-200"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      {actions.map((action) => {
        // Render separator
        if (action.id.startsWith('separator')) {
          return (
            <div key={action.id} className="border-t border-gray-100 my-1" />
          )
        }

        return (
          <button
            key={action.id}
            onClick={action.action}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 group"
          >
            <span className="text-lg w-6 text-center">{action.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-gray-800 group-hover:text-gray-900">
                {action.label}
              </div>
              <div className="text-xs text-gray-500 group-hover:text-gray-600">
                {action.description}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}