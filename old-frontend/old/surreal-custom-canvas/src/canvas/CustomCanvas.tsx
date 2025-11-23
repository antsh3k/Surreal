import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import rough from 'roughjs/bundled/rough.esm'
import type { RoughCanvas } from 'roughjs/bin/canvas'
import { useAtom } from 'jotai'
import { canvasStateAtom, recordInteractionAtom, selectedNodeAtom, addNodeAtom, updateNodeAtom } from '../stores/creativeCanvasStore'
import { useRoughCanvas } from '../hooks/useRoughCanvas'
import { useOrganicLayout } from '../hooks/useOrganicLayout'
import { styled } from '../stitches.config'
import type { InteractionEvent } from '../types'
import { mockDataService } from '../services/mockDataService'
import CreativeContextMenu from '../components/interactions/CreativeContextMenu'

const CanvasContainer = styled('div', {
  width: '100vw',
  height: '100vh',
  backgroundColor: '$paper',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'default', // Normal cursor, not crosshair
  
  // Paper texture overlay
  '&::before': {
    content: '',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.1"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    pointerEvents: 'none',
    opacity: 0.3,
  }
})

const TopicInput = styled('input', {
  position: 'absolute',
  top: '40px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '$3 $4',
  fontSize: '$4',
  fontFamily: '$reading',
  border: '2px solid $pencil',
  borderRadius: '$2',
  backgroundColor: 'white',
  color: '$ink',
  minWidth: '400px',
  textAlign: 'center',
  zIndex: 100,
  
  '&:focus': {
    outline: 'none',
    borderColor: '$ink',
    boxShadow: '0 0 0 2px rgba(42, 43, 42, 0.1)'
  }
})

const StatusBar = styled('div', {
  position: 'absolute',
  bottom: '20px',
  left: '20px',
  padding: '$2 $3',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid $pencil',
  borderRadius: '$2',
  fontFamily: '$reading',
  fontSize: '$2',
  color: '$pencil',
  zIndex: 100,
})

const CustomCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [roughCanvas, setRoughCanvas] = useState<RoughCanvas | null>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [topicInput, setTopicInput] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string
    position: { x: number; y: number }
  } | null>(null)
  
  const [canvasState, setCanvasState] = useAtom(canvasStateAtom)
  const [, recordInteraction] = useAtom(recordInteractionAtom)
  const [, setSelectedNode] = useAtom(selectedNodeAtom)
  const [, addNode] = useAtom(addNodeAtom)
  const [, updateNode] = useAtom(updateNodeAtom)
  
  const { drawNode, drawConnection } = useRoughCanvas(roughCanvas)
  const { organicPositions } = useOrganicLayout(canvasState.nodes)

  // Initialize rough canvas
  useEffect(() => {
    if (canvasRef.current) {
      const rc = rough.canvas(canvasRef.current)
      setRoughCanvas(rc)
    }
  }, [])

  // Handle responsive canvas
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Render nodes with hand-drawn style
  useEffect(() => {
    if (!roughCanvas || !canvasRef.current) return
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    
    // Clear canvas with subtle paper texture
    ctx.fillStyle = '#FEFCF3'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)
    
    // Draw connections first (behind nodes)
    canvasState.connections.forEach(connection => {
      const fromPos = organicPositions[connection.from]
      const toPos = organicPositions[connection.to]
      if (fromPos && toPos) {
        drawConnection(fromPos, toPos, connection.style)
      }
    })
    
    // Draw nodes with organic style
    canvasState.nodes.forEach(node => {
      const position = organicPositions[node.id]
      if (position) {
        drawNode(node, position)
      }
    })
    
  }, [canvasState.nodes, canvasState.connections, organicPositions, roughCanvas, dimensions])

  // Handle canvas click interactions
  const handleCanvasClick = (event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Find clicked node
    const clickedNode = canvasState.nodes.find(node => {
      const pos = organicPositions[node.id]
      if (!pos) return false
      
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      return distance < 70 // Node hit radius
    })
    
    if (clickedNode) {
      // Record interaction for preference learning
      const interaction: InteractionEvent = {
        type: 'click',
        nodeId: clickedNode.id,
        timestamp: Date.now(),
        position: { x, y }
      }
      recordInteraction(interaction)
      setSelectedNode(clickedNode.id)
      
      // Expand node if uncertain
      if (clickedNode.isUncertain) {
        handleNodeExpansion(clickedNode.id)
      }
    }
  }

  // Handle right-click for context menu
  const handleCanvasRightClick = (event: React.MouseEvent) => {
    event.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Find right-clicked node
    const clickedNode = canvasState.nodes.find(node => {
      const pos = organicPositions[node.id]
      if (!pos) return false
      
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      return distance < 70 // Node hit radius
    })
    
    if (clickedNode) {
      // Only show context menu for solid (non-uncertain) nodes
      if (!clickedNode.isUncertain) {
        const interaction: InteractionEvent = {
          type: 'rightClick',
          nodeId: clickedNode.id,
          timestamp: Date.now(),
          position: { x, y }
        }
        recordInteraction(interaction)
        
        // Show context menu at click position
        setContextMenu({
          nodeId: clickedNode.id,
          position: { x: event.clientX, y: event.clientY }
        })
      }
    }
  }

  // Node expansion with mock AI service
  const handleNodeExpansion = async (nodeId: string) => {
    setCanvasState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const expandedNodes = await mockDataService.expandConcept(nodeId, canvasState.currentTopic || '')
      
      // Add new nodes to canvas
      expandedNodes.forEach(node => addNode(node))
      
      // Mark parent node as no longer uncertain
      updateNode(nodeId, { isUncertain: false })
      
    } catch (error) {
      console.error('Failed to expand node:', error)
    } finally {
      setCanvasState(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Handle topic submission
  const handleTopicSubmit = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && topicInput.trim()) {
      generateInitialNodes(topicInput.trim())
    }
  }

  // Initial node generation with mock AI service
  const generateInitialNodes = async (topic: string) => {
    setCanvasState(prev => ({ 
      ...prev, 
      isLoading: true, 
      currentTopic: topic,
      nodes: [],
      connections: []
    }))
    
    try {
      const initialNodes = await mockDataService.generateInitialConcepts(topic)
      
      // Add all nodes to canvas
      setCanvasState(prev => ({
        ...prev,
        nodes: initialNodes,
        isLoading: false
      }))
      
    } catch (error) {
      console.error('Failed to generate initial concepts:', error)
      setCanvasState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const getStatusText = () => {
    if (canvasState.isLoading) return 'Drawing new concepts...'
    if (canvasState.nodes.length === 0) return 'Enter a topic to start exploring'
    
    const totalInteractions = canvasState.nodes.filter(n => !n.isUncertain).length
    const preferredConcepts = canvasState.nodes.filter(n => n.preferenceScore > 0.3).length
    
    if (totalInteractions < 3) {
      return 'Click dashed concepts to expand • The system is learning your preferences'
    } else if (preferredConcepts === 0) {
      return 'Learning your preferences... Keep exploring concepts that interest you'
    } else {
      return `Learning your preferences • ${preferredConcepts} concepts match your interests`
    }
  }

  // Handle context menu actions
  const handleContextMenuAction = (nodeId: string, action: string) => {
    console.log(`Action "${action}" on node "${nodeId}"`)
    
    switch (action) {
      case 'favorite':
        updateNode(nodeId, { preferenceScore: 1.0 })
        break
      case 'delete':
        // Remove node and its children
        setCanvasState(prev => ({
          ...prev,
          nodes: prev.nodes.filter(n => n.id !== nodeId && n.parentId !== nodeId)
        }))
        break
      case 'generate-image':
      case 'find-video':
      case 'summarize':
      case 'color':
        // These would integrate with AI services in a real implementation
        alert(`${action} feature coming soon!`)
        break
    }
  }

  return (
    <CanvasContainer>
      <TopicInput
        placeholder="Enter any topic to explore... (e.g., 'Active Inference in AI', 'Jazz Music', 'Next.js Authentication')"
        value={topicInput}
        onChange={(e) => setTopicInput(e.target.value)}
        onKeyPress={handleTopicSubmit}
      />
      
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasRightClick}
      />
      
      <StatusBar>
        {getStatusText()}
      </StatusBar>
      
      {/* Creative UI Overlays */}
      <AnimatePresence>
        {canvasState.isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.9, 1, 1, 0.9]
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop" as const
            }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#6B7280',
              fontSize: '18px',
              fontFamily: 'Caveat, cursive',
              textAlign: 'center' as const,
              zIndex: 200
            }}
          >
            <div style={{ marginBottom: '8px' }}>Drawing new concepts...</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>✨ Thinking deeply about your interests ✨</div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Context Menu */}
      {contextMenu && (
        <CreativeContextMenu
          nodeId={contextMenu.nodeId}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
        />
      )}
    </CanvasContainer>
  )
}

export default CustomCanvas