import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Position } from '../../types'

interface ContextMenuProps {
  nodeId: string
  position: Position
  onClose: () => void
  onAction: (action: string, nodeId: string) => void
}

const ContextMenu = ({ nodeId, position, onClose, onAction }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const menuItems = [
    {
      id: 'generate-diagram',
      label: 'Generate Diagram',
      icon: '🎨',
      description: 'Create visual representation'
    },
    {
      id: 'create-summary',
      label: 'Create Summary',
      icon: '📄',
      description: 'Generate text summary'
    },
    {
      id: 'find-video',
      label: 'Find Video',
      icon: '📹',
      description: 'Search for related videos'
    },
    {
      id: 'expand-related',
      label: 'Find Related',
      icon: '🔗',
      description: 'Discover connected concepts'
    },
    { id: 'divider', label: '', icon: '', description: '' },
    {
      id: 'pin-top',
      label: 'Pin to Top',
      icon: '📌',
      description: 'Keep visible while exploring'
    },
    {
      id: 'export-node',
      label: 'Export Node',
      icon: '📤',
      description: 'Save this concept'
    },
    {
      id: 'remove-branch',
      label: 'Remove Branch',
      icon: '🗑️',
      description: 'Delete this and child nodes'
    }
  ]

  const handleItemClick = (actionId: string) => {
    if (actionId !== 'divider') {
      onAction(actionId, nodeId)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[220px]"
        style={{ 
          left: position.x, 
          top: position.y,
          transform: 'translate(-50%, -10px)' // Center horizontally, slight offset vertically
        }}
      >
        {menuItems.map((item, index) => (
          item.id === 'divider' ? (
            <div key={index} className="h-px bg-gray-200 my-1 mx-2" />
          ) : (
            <motion.button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150
                       flex items-center gap-3 text-sm focus:outline-none focus:bg-gray-50
                       group"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-base">{item.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500 group-hover:text-gray-600">
                  {item.description}
                </div>
              </div>
            </motion.button>
          )
        ))}
      </motion.div>
    </AnimatePresence>
  )
}

export default ContextMenu