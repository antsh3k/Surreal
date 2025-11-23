import { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Group } from 'react-konva'
import Konva from 'konva'
import { useCanvasStore } from '../../stores/canvasStore'
import { useCanvasInteractions } from '../../hooks/useCanvasInteractions'
import { ConceptNodeCanvas } from './ConceptNodeCanvas'
import { ConnectionLayer } from './ConnectionLayer'

export const KonvaStage = () => {
  const stageRef = useRef<Konva.Stage>(null)
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  })
  
  const { 
    nodes, 
    connections, 
    viewport,
    selectedNodeId,
    isLoading
  } = useCanvasStore()
  
  const {
    handleNodeClick,
    handleNodeRightClick,
    handleStageClick,
    handleWheel,
    handleDrag,
    handleTouchMove
  } = useCanvasInteractions(stageRef as React.RefObject<Konva.Stage>)

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Performance optimization: batch draw updates
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.batchDraw()
    }
  }, [nodes, connections, viewport])

  // Apply viewport transformations
  useEffect(() => {
    const stage = stageRef.current
    if (stage) {
      stage.position({ x: viewport.x, y: viewport.y })
      stage.scale({ x: viewport.scale, y: viewport.scale })
      stage.batchDraw()
    }
  }, [viewport])

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNodeId) return
      
      // Space key to expand selected node
      if (e.code === 'Space') {
        e.preventDefault()
        const selectedNode = nodes.find(n => n.id === selectedNodeId)
        if (selectedNode?.isUncertain) {
          useCanvasStore.getState().expandNode(selectedNodeId)
        }
      }
      
      // Arrow keys for navigation (could be implemented)
      // Escape to deselect
      if (e.code === 'Escape') {
        useCanvasStore.getState().setSelectedNode(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, nodes])

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden relative">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onDragEnd={handleDrag}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onTouchMove={handleTouchMove}
        draggable
      >
        {/* Connection layer (behind nodes) */}
        <Layer>
          <ConnectionLayer connections={connections} nodes={nodes} />
        </Layer>
        
        {/* Node layer */}
        <Layer>
          <Group>
            {nodes.map(node => (
              <ConceptNodeCanvas
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={handleNodeClick}
                onRightClick={handleNodeRightClick}
              />
            ))}
          </Group>
        </Layer>
        
        {/* UI overlay layer (non-interactive) */}
        <Layer listening={false}>
          {/* Performance indicators, debug info, etc. can go here */}
          {import.meta.env.DEV && (
            <Group>
              {/* Debug info */}
              {/* Debug text removed for cleaner production build */}
            </Group>
          )}
        </Layer>
      </Stage>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center pointer-events-none">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-600 font-medium">
              {useCanvasStore.getState().loadingMessage || 'Loading...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}