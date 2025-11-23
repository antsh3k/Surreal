import { useState, useCallback, useRef } from 'react'

export interface CameraState {
  x: number
  y: number
  zoom: number
}

export interface CameraControls {
  camera: CameraState
  panBy: (deltaX: number, deltaY: number) => void
  zoomTo: (zoom: number, center?: { x: number; y: number }) => void
  zoomIn: () => void
  zoomOut: () => void
  resetCamera: () => void
  fitToView: (bounds?: { x: number; y: number; width: number; height: number }) => void
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.2

export const useCamera = (
  initialCamera: CameraState = { x: 0, y: 0, zoom: 1 }
): CameraControls => {
  const [camera, setCamera] = useState<CameraState>(initialCamera)
  const containerRef = useRef<HTMLElement | null>(null)

  const panBy = useCallback((deltaX: number, deltaY: number) => {
    setCamera(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))
  }, [])

  const zoomTo = useCallback((zoom: number, center?: { x: number; y: number }) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    
    setCamera(prev => {
      if (!center) {
        return { ...prev, zoom: clampedZoom }
      }

      // Zoom towards a specific point
      const zoomDelta = clampedZoom / prev.zoom
      const newX = center.x - (center.x - prev.x) * zoomDelta
      const newY = center.y - (center.y - prev.y) * zoomDelta

      return {
        x: newX,
        y: newY,
        zoom: clampedZoom
      }
    })
  }, [])

  const zoomIn = useCallback(() => {
    setCamera(prev => ({
      ...prev,
      zoom: Math.min(MAX_ZOOM, prev.zoom + ZOOM_STEP)
    }))
  }, [])

  const zoomOut = useCallback(() => {
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, prev.zoom - ZOOM_STEP)
    }))
  }, [])

  const resetCamera = useCallback(() => {
    setCamera(initialCamera)
  }, [initialCamera])

  const fitToView = useCallback((bounds?: { x: number; y: number; width: number; height: number }) => {
    if (!bounds) {
      resetCamera()
      return
    }

    // Get container dimensions (assume viewport if not available)
    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight
    
    // Calculate zoom to fit content with some padding
    const padding = 100
    const scaleX = (containerWidth - padding * 2) / bounds.width
    const scaleY = (containerHeight - padding * 2) / bounds.height
    const scale = Math.min(scaleX, scaleY, MAX_ZOOM)
    
    // Center the content
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const offsetX = containerWidth / 2 - centerX * scale
    const offsetY = containerHeight / 2 - centerY * scale

    setCamera({
      x: offsetX,
      y: offsetY,
      zoom: Math.max(MIN_ZOOM, scale)
    })
  }, [resetCamera])

  return {
    camera,
    panBy,
    zoomTo,
    zoomIn,
    zoomOut,
    resetCamera,
    fitToView
  }
}