import { useCallback, useRef, useEffect } from 'react'
import type { CameraControls } from './useCamera'

interface PanZoomOptions {
  onPanStart?: () => void
  onPanEnd?: () => void
  onZoom?: (zoom: number) => void
  disabled?: boolean
}

export const usePanZoom = (
  containerRef: React.RefObject<HTMLElement>,
  camera: CameraControls,
  options: PanZoomOptions = {}
) => {
  const isPanningRef = useRef(false)
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const startPositionRef = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (options.disabled) return
    
    isPanningRef.current = true
    lastPositionRef.current = { x: e.clientX, y: e.clientY }
    startPositionRef.current = { x: e.clientX, y: e.clientY }
    options.onPanStart?.()
    
    e.preventDefault()
    document.body.style.cursor = 'grabbing'
  }, [options])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanningRef.current || options.disabled) return

    const deltaX = e.clientX - lastPositionRef.current.x
    const deltaY = e.clientY - lastPositionRef.current.y
    
    camera.panBy(deltaX, deltaY)
    
    lastPositionRef.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }, [camera, options.disabled])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isPanningRef.current) return
    
    isPanningRef.current = false
    document.body.style.cursor = ''
    options.onPanEnd?.()
    
    e.preventDefault()
  }, [options])

  const handleWheel = useCallback((e: WheelEvent) => {
    if (options.disabled) return
    
    e.preventDefault()
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = e.clientX - rect.left
    const centerY = e.clientY - rect.top
    
    // Normalize wheel delta (different between browsers)
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = camera.camera.zoom + delta
    
    camera.zoomTo(newZoom, { x: centerX, y: centerY })
    options.onZoom?.(newZoom)
  }, [camera, containerRef, options])

  // Touch events for mobile support
  const touchStartRef = useRef<{ x: number; y: number; distance?: number } | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (options.disabled) return
    
    if (e.touches.length === 1) {
      // Single touch - pan
      isPanningRef.current = true
      const touch = e.touches[0]
      lastPositionRef.current = { x: touch.clientX, y: touch.clientY }
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      options.onPanStart?.()
    } else if (e.touches.length === 2) {
      // Multi-touch - zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      touchStartRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance
      }
    }
    
    e.preventDefault()
  }, [options])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (options.disabled) return
    
    if (e.touches.length === 1 && isPanningRef.current) {
      // Single touch pan
      const touch = e.touches[0]
      const deltaX = touch.clientX - lastPositionRef.current.x
      const deltaY = touch.clientY - lastPositionRef.current.y
      
      camera.panBy(deltaX, deltaY)
      lastPositionRef.current = { x: touch.clientX, y: touch.clientY }
    } else if (e.touches.length === 2 && touchStartRef.current?.distance) {
      // Multi-touch zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const scale = currentDistance / touchStartRef.current.distance
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const relativeX = centerX - rect.left
        const relativeY = centerY - rect.top
        camera.zoomTo(camera.camera.zoom * scale, { x: relativeX, y: relativeY })
      }
    }
    
    e.preventDefault()
  }, [camera, containerRef, options.disabled])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0) {
      isPanningRef.current = false
      touchStartRef.current = null
      options.onPanEnd?.()
    }
    e.preventDefault()
  }, [options])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('wheel', handleWheel, { passive: false })

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('wheel', handleWheel)
      
      container.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      
      // Reset cursor
      document.body.style.cursor = ''
    }
  }, [
    containerRef, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  ])

  return {
    isPanning: isPanningRef.current
  }
}