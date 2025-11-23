import { useCallback } from 'react'
import rough from 'roughjs/bundled/rough.esm'
import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { ConceptNodeData } from '../types'

export const useRoughCanvas = (roughCanvas: RoughCanvas | null) => {
  
  const drawNode = useCallback((node: ConceptNodeData, position: { x: number; y: number }) => {
    if (!roughCanvas) return
    
    const { x, y } = position
    const width = 140
    const height = 60
    
    // Node style based on state: FIRST border (dashed/solid), THEN preference overlay
    const getNodeStyle = () => {
      // Base style: Clean white background, subtle border
      let baseStyle = {
        fill: 'white',
        stroke: '#E5E5E5', // Light gray for neutral state
        strokeWidth: 1.5,
        roughness: 1.0,
        fillStyle: 'solid' as const
      }

      // Step 1: Determine border type based on expandable state
      if (node.isUncertain) {
        // DASHED = "Click me to expand"
        baseStyle = {
          ...baseStyle,
          stroke: '#CCCCCC',
          strokeLineDash: [8, 4],
          strokeLineDashOffset: Math.random() * 6
        }
      } else {
        // SOLID = "I'm complete/expanded"
        baseStyle = {
          ...baseStyle, 
          stroke: '#2A2B2A', // Darker for completed state
          strokeWidth: 1.5
        }
      }

      // Step 2: Apply preference overlay (subtle tints, not full colors)
      if (node.preferenceScore > 0.6) {
        // Strong preference: Subtle green tint + slight green border
        return {
          ...baseStyle,
          fill: '#F0FDF4', // Very subtle green background
          stroke: node.isUncertain ? '#10B981' : '#059669' // Green border tint
        }
      } else if (node.preferenceScore > 0.3) {
        // Medium preference: Light green tint
        return {
          ...baseStyle,
          fill: '#F7FEF7', // Even lighter green
          stroke: node.isUncertain ? '#6EE7B7' : '#10B981'
        }
      } else if (node.preferenceScore < -0.3) {
        // Uncertain relevance: Subtle orange tint  
        return {
          ...baseStyle,
          fill: '#FEF7F0', // Very subtle orange
          stroke: node.isUncertain ? '#F59E0B' : '#EA580C'
        }
      }
      
      return baseStyle
    }
    
    const style = getNodeStyle()
    
    // Draw hand-drawn rectangle for node background
    roughCanvas.rectangle(x - width/2, y - height/2, width, height, {
      ...style,
      seed: node.id.charCodeAt(0) // Consistent randomness per node
    })
    
    // Draw hand-written text (approximation)
    const canvas = (roughCanvas as any).canvas
    const ctx = canvas.getContext('2d')!
    
    // Save context for text
    ctx.save()
    ctx.font = '16px Caveat, cursive' // Hand-written font
    ctx.fillStyle = '#2A2B2A'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add slight text rotation for organic feel
    const textRotation = (Math.random() - 0.5) * 0.1 // ±3 degrees
    ctx.translate(x, y)
    ctx.rotate(textRotation)
    
    // Multi-line text handling
    const words = node.label.split(' ')
    const lines = []
    let currentLine = words[0]
    
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i]
      const metrics = ctx.measureText(testLine)
      if (metrics.width > width - 20) {
        lines.push(currentLine)
        currentLine = words[i]
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
    
    // Draw each line with slight organic offset
    const lineHeight = 18
    const totalHeight = lines.length * lineHeight
    const startY = -totalHeight / 2 + lineHeight / 2
    
    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight
      const xOffset = (Math.random() - 0.5) * 2 // Slight handwriting wobble
      ctx.fillText(line, xOffset, lineY)
    })
    
    // Add "click me" indicator ONLY for uncertain (dashed) nodes
    if (node.isUncertain) {
      ctx.restore()
      ctx.save()
      
      // Draw sketchy arrow pointing to node
      roughCanvas.path(`M ${x - width/2 - 20} ${y + height/2 + 10} Q ${x - width/2 - 10} ${y + height/2 + 20} ${x - width/2} ${y + height/2}`, {
        stroke: '#9CA3AF',
        strokeWidth: 1.5,
        roughness: 2.5,
        seed: (node.id + 'arrow').charCodeAt(0)
      })
      
      // Handwritten "click me!" 
      ctx.font = '12px Caveat, cursive'
      ctx.fillStyle = '#9CA3AF'
      ctx.textAlign = 'left'
      ctx.fillText('click me!', x - width/2 - 50, y + height/2 + 15)
    }
    
    // Add preference indicator with hand-drawn stars (ONLY for very high preference)
    if (node.preferenceScore > 0.7) {
      for (let i = 0; i < 3; i++) {
        const starX = x + width/2 + 10 + i * 15
        const starY = y - height/2 - 10
        
        // Draw rough star
        roughCanvas.path(`M ${starX} ${starY-5} L ${starX+3} ${starY-1} L ${starX+7} ${starY-1} L ${starX+4} ${starY+2} L ${starX+5} ${starY+6} L ${starX} ${starY+3} L ${starX-5} ${starY+6} L ${starX-4} ${starY+2} L ${starX-7} ${starY-1} L ${starX-3} ${starY-1} Z`, {
          fill: '#FEF08A',
          stroke: '#F59E0B',
          strokeWidth: 1,
          roughness: 1.8,
          seed: (node.id + 'star' + i).charCodeAt(0)
        })
      }
    }
    
    ctx.restore()
    
  }, [roughCanvas])
  
  const drawConnection = useCallback((
    from: { x: number; y: number }, 
    to: { x: number; y: number },
    style: any = {}
  ) => {
    if (!roughCanvas) return
    
    // Create organic, hand-drawn connection
    const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 20
    const midY = (from.y + to.y) / 2 + (Math.random() - 0.5) * 20
    
    // Curved path for organic feel
    const pathData = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`
    
    roughCanvas.path(pathData, {
      stroke: style.color || '#9CA3AF',
      strokeWidth: style.width || 2,
      roughness: 1.5,
      fill: 'none',
      seed: (from.x + from.y + to.x + to.y) % 100 // Consistent randomness
    })
    
  }, [roughCanvas])
  
  const drawSketch = useCallback((points: { x: number; y: number }[], style: any = {}) => {
    if (!roughCanvas || points.length < 2) return
    
    // Convert points to path
    const pathData = points.reduce((path, point, index) => {
      return index === 0 
        ? `M ${point.x} ${point.y}` 
        : `${path} L ${point.x} ${point.y}`
    }, '')
    
    roughCanvas.path(pathData, {
      stroke: style.color || '#6B7280',
      strokeWidth: style.width || 2,
      roughness: 2.0,
      fill: 'none'
    })
    
  }, [roughCanvas])
  
  return {
    drawNode,
    drawConnection,
    drawSketch
  }
}