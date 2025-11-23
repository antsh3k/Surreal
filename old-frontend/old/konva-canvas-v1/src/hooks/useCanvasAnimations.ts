import { useCallback } from 'react'
import Konva from 'konva'

export const useCanvasAnimations = () => {
  
  const animateNodeAppearance = useCallback((node: Konva.Group) => {
    // Initial state - clean entrance
    node.scale({ x: 0.8, y: 0.8 })
    node.opacity(0)
    
    // Smooth elegant appearance
    node.to({
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      duration: 0.5,
      easing: Konva.Easings.EaseOut,
    })
  }, [])
  
  const animatePreferenceChange = useCallback((rect: Konva.Rect, preferenceScore: number) => {
    // Create subtle glow effect for preferred nodes
    if (preferenceScore > 0.3) {
      rect.to({
        shadowBlur: 15,
        shadowOpacity: 0.4,
        duration: 0.5,
        easing: Konva.Easings.EaseInOut,
      })
    } else if (preferenceScore < -0.2) {
      rect.to({
        shadowBlur: 8,
        shadowOpacity: 0.2,
        duration: 0.5,
        easing: Konva.Easings.EaseInOut,
      })
    } else {
      rect.to({
        shadowBlur: 4,
        shadowOpacity: 0.1,
        duration: 0.5,
        easing: Konva.Easings.EaseInOut,
      })
    }
  }, [])
  
  const animateNodeExpansion = useCallback((parentNode: Konva.Group, childNodes: Konva.Group[]) => {
    // Parent node subtle pulse to indicate expansion
    parentNode.to({
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 0.15,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        parentNode.to({
          scaleX: 1,
          scaleY: 1,
          duration: 0.15,
          easing: Konva.Easings.EaseIn,
        })
      }
    })
    
    // Stagger child node animations for smooth appearance
    childNodes.forEach((child, index) => {
      child.scale({ x: 0, y: 0 })
      child.opacity(0)
      
      setTimeout(() => {
        child.to({
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          duration: 0.3,
          easing: Konva.Easings.EaseOut,
        })
      }, index * 100) // Stagger by 100ms
    })
  }, [])
  
  const animateConnectionDraw = useCallback((line: Konva.Line) => {
    // Animate line drawing from start to end
    const points = line.points()
    if (points.length < 4) return
    
    // Start with line at beginning point only
    line.points([points[0], points[1], points[0], points[1]])
    
    // Animate to full line
    line.to({
      points: points,
      duration: 0.5,
      easing: Konva.Easings.EaseOut,
    })
  }, [])
  
  const animateHoverEffect = useCallback((node: Konva.Group, isHover: boolean) => {
    const scale = isHover ? 1.03 : 1 // Subtle hover effect
    const duration = 0.25
    
    node.to({
      scaleX: scale,
      scaleY: scale,
      duration,
      easing: Konva.Easings.EaseOut,
    })
  }, [])
  
  const animateSelection = useCallback((node: Konva.Group, isSelected: boolean) => {
    const rect = node.findOne('Rect')
    if (!rect) return
    
    if (isSelected) {
      rect.to({
        shadowBlur: 20,
        shadowOpacity: 0.3,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        duration: 0.3,
        easing: Konva.Easings.EaseOut,
      })
    } else {
      rect.to({
        shadowBlur: 4,
        shadowOpacity: 0.1,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        duration: 0.3,
        easing: Konva.Easings.EaseOut,
      })
    }
  }, [])
  
  const animateLoading = useCallback((node: Konva.Group) => {
    // Subtle pulsing animation during loading
    const pulseAnimation = () => {
      node.to({
        opacity: 0.6,
        duration: 1,
        easing: Konva.Easings.EaseInOut,
        onFinish: () => {
          node.to({
            opacity: 1,
            duration: 1,
            easing: Konva.Easings.EaseInOut,
            onFinish: pulseAnimation
          })
        }
      })
    }
    
    pulseAnimation()
    
    // Return cleanup function
    return () => {
      node.to({
        opacity: 1,
        duration: 0.2,
        easing: Konva.Easings.EaseOut,
      })
    }
  }, [])

  return {
    animateNodeAppearance,
    animatePreferenceChange,
    animateNodeExpansion,
    animateConnectionDraw,
    animateHoverEffect,
    animateSelection,
    animateLoading
  }
}