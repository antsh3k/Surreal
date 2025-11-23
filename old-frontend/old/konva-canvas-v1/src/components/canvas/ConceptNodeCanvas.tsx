import { useRef, useEffect, useState } from 'react'
import { Group, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import Konva from 'konva'
import type { ConceptNodeData } from '../../types'
import { useCanvasAnimations } from '../../hooks/useCanvasAnimations'
import { usePreferenceStore } from '../../stores/preferenceStore'

interface ConceptNodeCanvasProps {
  node: ConceptNodeData
  isSelected: boolean
  onClick: (nodeId: string, event: KonvaEventObject<MouseEvent>) => void
  onRightClick: (nodeId: string, event: KonvaEventObject<MouseEvent>) => void
}

export const ConceptNodeCanvas = ({ 
  node, 
  isSelected, 
  onClick, 
  onRightClick 
}: ConceptNodeCanvasProps) => {
  const groupRef = useRef<Konva.Group>(null)
  const rectRef = useRef<Konva.Rect>(null)
  const [, setIsHovered] = useState(false)
  
  const { 
    animateNodeAppearance, 
    animatePreferenceChange, 
    animateHoverEffect,
    animateSelection
  } = useCanvasAnimations()
  
  const { getPreferenceScore, recordClick } = usePreferenceStore()
  
  // Calculate preference-based styling
  const preferenceScore = getPreferenceScore(node.concept)
  
  const getNodeStyle = () => {
    const baseStyle = {
      width: node.size.width,
      height: node.size.height,
      cornerRadius: node.level === 0 ? 12 : 8, // Central topic gets more rounded corners
      shadowBlur: isSelected ? 8 : (node.level === 0 ? 6 : 3),
      shadowOpacity: isSelected ? 0.2 : (node.level === 0 ? 0.15 : 0.1),
      shadowOffsetX: 0,
      shadowOffsetY: node.level === 0 ? 4 : 2,
      shadowColor: '#000000'
    }

    // Central topic node (level 0) gets special styling
    if (node.level === 0) {
      return {
        ...baseStyle,
        fill: '#F8FAFC', // Subtle blue-gray background
        stroke: '#3B82F6', // Blue border for central topic
        strokeWidth: 3
      }
    }

    // Start with clean neutral design for child nodes - no preference colors initially
    if (node.isUncertain) {
      return {
        ...baseStyle,
        fill: '#FFFFFF',
        stroke: '#D1D5DB', // Clean gray dashed border
        strokeWidth: 2,
        dash: [5, 5] // "Dashed borders mean click to expand"
      }
    }

    // Only show preference colors AFTER learning has occurred
    if (preferenceScore > 0.3) {
      return {
        ...baseStyle,
        fill: '#F0FDF4', // Subtle green tint = "System thinks you'll like this"
        stroke: '#10B981',
        strokeWidth: 2
      }
    } else if (preferenceScore < -0.2) {
      return {
        ...baseStyle,
        fill: '#FEF3C7', // Subtle orange tint = "Uncertain relevance"
        stroke: '#F59E0B', 
        strokeWidth: 2
      }
    }
    
    // Clean neutral state
    return {
      ...baseStyle,
      fill: '#FFFFFF',
      stroke: '#E5E7EB', // Clean subtle gray borders
      strokeWidth: 1
    }
  }

  // Animate node appearance on mount
  useEffect(() => {
    if (groupRef.current) {
      animateNodeAppearance(groupRef.current)
    }
  }, [animateNodeAppearance])

  // Animate preference changes
  useEffect(() => {
    if (rectRef.current) {
      animatePreferenceChange(rectRef.current, preferenceScore)
    }
  }, [preferenceScore, animatePreferenceChange])

  // Animate selection changes
  useEffect(() => {
    if (groupRef.current) {
      animateSelection(groupRef.current, isSelected)
    }
  }, [isSelected, animateSelection])

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    recordClick(node.id, node.concept)
    onClick(node.id, e)
  }

  const handleRightClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onRightClick(node.id, e)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    document.body.style.cursor = 'pointer'
    
    if (groupRef.current) {
      animateHoverEffect(groupRef.current, true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    document.body.style.cursor = 'default'
    
    if (groupRef.current) {
      animateHoverEffect(groupRef.current, false)
    }
  }

  const style = getNodeStyle()
  
  // Clean typography system
  const fontSize = node.level === 0 ? 20 : 16
  const fontWeight = node.level === 0 ? '600' : '500'
  
  // Helper text based on node state per README-V2.md
  const getHelperText = () => {
    if (node.level === 0) return "" // Central topic doesn't need helper text
    if (node.isUncertain) return "Click to explore"
    if (preferenceScore > 0.3) return "Likely interesting"
    if (preferenceScore < -0.2) return "Uncertain relevance" 
    return ""
  }

  const getHelperTextColor = () => {
    if (preferenceScore > 0.3) return "#10B981"
    if (preferenceScore < -0.2) return "#F59E0B"
    return "#6B7280"
  }

  return (
    <Group
      ref={groupRef}
      x={node.position.x}
      y={node.position.y}
      onClick={handleClick}
      onTap={handleClick} // Mobile support
      onContextMenu={handleRightClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Node background rectangle */}
      <Rect
        ref={rectRef}
        {...style}
      />
      
      {/* Main node text - clean typography */}
      <Text
        text={node.label}
        x={16}
        y={node.size.height / 2 - 10}
        width={node.size.width - 32}
        fontSize={fontSize}
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontStyle={fontWeight}
        fill="#111111"
        align="center"
        verticalAlign="middle"
        wrap="word"
        ellipsis={true}
        lineHeight={1.2}
      />
      
      {/* Helper text - clean minimal */}
      {getHelperText() && (
        <Text
          text={getHelperText()}
          x={16}
          y={node.size.height - 28}
          width={node.size.width - 32}
          fontSize={11}
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
          fontStyle="400"
          fill={getHelperTextColor()}
          align="center"
          opacity={0.8}
        />
      )}
      
      {/* Level indicator for debugging (can be removed in production) */}
      {import.meta.env.DEV && (
        <Text
          text={`L${node.level}`}
          x={4}
          y={4}
          fontSize={8}
          fontFamily="mono"
          fill="#999999"
        />
      )}
    </Group>
  )
}