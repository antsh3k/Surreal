import { useCallback, useRef } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'
import Konva from 'konva'
import { useCanvasStore } from '../stores/canvasStore'
import { usePreferenceStore } from '../stores/preferenceStore'

export const useCanvasInteractions = (stageRef: React.RefObject<Konva.Stage>) => {
  const longPressTimer = useRef<number>(0)
  const lastTapTime = useRef(0)
  const { 
    expandNode, 
    setContextMenu, 
    setSelectedNode, 
    setViewport 
  } = useCanvasStore()
  
  const { recordClick } = usePreferenceStore()

  const handleNodeClick = useCallback((nodeId: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapTime.current
    
    // Handle double tap for mobile (same as right click)
    if (e.evt.type === 'touchend' && timeSinceLastTap < 300) {
      handleNodeRightClick(nodeId, e)
      return
    }
    
    // Select the node
    setSelectedNode(nodeId)
    
    // Record the interaction for preference learning
    recordClick(nodeId, 'node-click')
    
    // Expand the node if it's uncertain/expandable
    const stage = stageRef.current
    if (stage) {
      const node = stage.findOne(`#${nodeId}`)
      if (node && node.getAttr('conceptData')?.isUncertain) {
        expandNode(nodeId)
      }
    }
    
    lastTapTime.current = now
  }, [expandNode, setSelectedNode, recordClick])

  const handleNodeRightClick = useCallback((nodeId: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return
    
    // Get pointer position relative to the page
    const pointerPosition = stage.getPointerPosition()
    if (pointerPosition) {
      // Convert canvas coordinates to screen coordinates
      const containerRect = stage.container().getBoundingClientRect()
      const screenPosition = {
        x: containerRect.left + pointerPosition.x,
        y: containerRect.top + pointerPosition.y
      }
      
      setContextMenu({
        nodeId,
        position: screenPosition,
        visible: true
      })
    }
  }, [setContextMenu])

  const handleTouchStart = useCallback((nodeId: string, e: KonvaEventObject<TouchEvent>) => {
    // Long press for context menu on mobile
    longPressTimer.current = window.setTimeout(() => {
      handleNodeRightClick(nodeId, e)
    }, 500)
  }, [handleNodeRightClick])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current)
    }
  }, [])

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Clicked on empty canvas - deselect nodes and hide context menu
    if (e.target === stageRef.current) {
      setSelectedNode(null)
      setContextMenu(null)
    }
  }, [setSelectedNode, setContextMenu])

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const scaleBy = 1.05
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    
    // Limit zoom levels
    const clampedScale = Math.max(0.1, Math.min(3, newScale))

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    }
    
    // Update store state
    setViewport({
      x: newPos.x,
      y: newPos.y,
      scale: clampedScale
    })
  }, [setViewport])

  const handleDrag = useCallback((e: KonvaEventObject<DragEvent>) => {
    const stage = e.target as Konva.Stage
    setViewport({
      x: stage.x(),
      y: stage.y()
    })
  }, [setViewport])

  // Mobile pinch zoom support
  const handlePinch = useCallback((e: KonvaEventObject<TouchEvent>) => {
    const stage = stageRef.current
    if (!stage) return

    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]

    if (touch1 && touch2) {
      e.evt.preventDefault()
      
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      // Store initial distance for pinch calculation
      if (!stage.getAttr('lastPinchDistance')) {
        stage.setAttr('lastPinchDistance', dist)
        return
      }
      
      const lastDist = stage.getAttr('lastPinchDistance')
      const scale = stage.scaleX() * (dist / lastDist)
      const clampedScale = Math.max(0.1, Math.min(3, scale))
      
      // Center of pinch
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }
      
      const stageBox = stage.container().getBoundingClientRect()
      const pointerPosition = {
        x: center.x - stageBox.left,
        y: center.y - stageBox.top
      }
      
      const mousePointTo = {
        x: (pointerPosition.x - stage.x()) / stage.scaleX(),
        y: (pointerPosition.y - stage.y()) / stage.scaleY(),
      }
      
      const newPos = {
        x: pointerPosition.x - mousePointTo.x * clampedScale,
        y: pointerPosition.y - mousePointTo.y * clampedScale,
      }
      
      setViewport({
        x: newPos.x,
        y: newPos.y,
        scale: clampedScale
      })
      
      stage.setAttr('lastPinchDistance', dist)
    }
  }, [setViewport])

  const handleTouchMove = useCallback((e: KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 2) {
      handlePinch(e)
    }
  }, [handlePinch])

  return {
    handleNodeClick,
    handleNodeRightClick,
    handleTouchStart,
    handleTouchEnd,
    handleStageClick,
    handleWheel,
    handleDrag,
    handleTouchMove
  }
}