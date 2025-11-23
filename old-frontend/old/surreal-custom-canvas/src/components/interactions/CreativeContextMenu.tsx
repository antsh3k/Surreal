// import React from 'react' // Not needed with new JSX transform
import { motion, AnimatePresence } from 'framer-motion'
import { styled } from '../../stitches.config'
import { Palette, Image, Video, FileText, Trash2, Star } from 'lucide-react'

const MenuContainer = styled(motion.div, {
  position: 'fixed',
  backgroundColor: '$paper',
  border: '2px solid $ink',
  borderRadius: '$3',
  padding: '$2',
  zIndex: 1000,
  boxShadow: '4px 4px 0px $colors$ink',
  minWidth: '200px',
  
  // Hand-drawn border effect
  '&::before': {
    content: '',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: '$3',
    background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
    zIndex: -1,
  }
})

const MenuItem = styled('button', {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  width: '100%',
  padding: '$2',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '$2',
  fontFamily: '$handwritten',
  fontSize: '$3',
  color: '$ink',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'left',
  
  '&:hover': {
    backgroundColor: '$highlight',
    transform: 'rotate(-1deg) scale(1.02)',
  },
  
  '&:active': {
    transform: 'rotate(1deg) scale(0.98)',
  }
})

interface CreativeContextMenuProps {
  nodeId: string
  position: { x: number; y: number }
  onClose: () => void
  onAction: (nodeId: string, action: string) => void
}

const CreativeContextMenu = ({ 
  nodeId, 
  position, 
  onClose, 
  onAction 
}: CreativeContextMenuProps) => {
  
  const menuItems = [
    { icon: Palette, label: 'Color this idea', action: 'color' },
    { icon: Image, label: 'Sketch a diagram', action: 'generate-image' },
    { icon: Video, label: 'Find a video', action: 'find-video' },
    { icon: FileText, label: 'Write summary', action: 'summarize' },
    { icon: Star, label: 'Mark as favorite', action: 'favorite' },
    { icon: Trash2, label: 'Remove branch', action: 'delete' }
  ]
  
  return (
    <AnimatePresence>
      <MenuContainer
        initial={{ 
          scale: 0.8, 
          opacity: 0, 
          rotate: -5,
        }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          rotate: Math.random() * 4 - 2, // Random slight rotation
        }}
        exit={{ 
          scale: 0.8, 
          opacity: 0, 
          rotate: 5 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }}
        style={{
          left: position.x,
          top: position.y,
          transformOrigin: 'top left'
        }}
      >
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.action}
            onClick={() => {
              onAction(nodeId, item.action)
              onClose()
            }}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <item.icon size={18} />
            {item.label}
          </MenuItem>
        ))}
      </MenuContainer>
      
      {/* Backdrop */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          backgroundColor: 'transparent'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
    </AnimatePresence>
  )
}

export default CreativeContextMenu