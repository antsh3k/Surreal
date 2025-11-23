import { useState, useEffect, useMemo } from 'react'
import { ConceptNode, Position, LayoutOptions } from '../types'

export const useLayout = (nodes: ConceptNode[], options?: Partial<LayoutOptions>) => {
  const [positions, setPositions] = useState<Record<string, Position>>({})

  const defaultOptions: LayoutOptions = useMemo(() => ({
    algorithm: 'radial',
    spacing: 180,
    centerX: 600,
    centerY: 400,
    ...(options || {})
  }), [options])

  // Simple radial layout algorithm
  const calculateRadialLayout = useMemo(() => (nodes: ConceptNode[]) => {
    const newPositions: Record<string, Position> = {}
    const { centerX, centerY, spacing } = defaultOptions
    
    // Group nodes by hierarchy level based on parentId - safe implementation
    const nodesByLevel = nodes.reduce((acc, node) => {
      let level = 0
      if (node.parentId) {
        // Safe parent level finding with cycle detection
        const findLevel = (nodeId: string, visited = new Set<string>()): number => {
          if (visited.has(nodeId)) return 0 // Cycle detected, treat as root
          visited.add(nodeId)
          
          const parent = nodes.find(n => n.id === nodeId)
          if (!parent || !parent.parentId) return 0
          
          return findLevel(parent.parentId, visited) + 1
        }
        level = findLevel(node.parentId) + 1
      }
      
      if (!acc[level]) acc[level] = []
      acc[level].push(node)
      return acc
    }, {} as Record<number, ConceptNode[]>)

    Object.entries(nodesByLevel).forEach(([level, levelNodes]) => {
      const levelNum = parseInt(level)
      const radius = levelNum === 0 ? 0 : spacing + (levelNum * 150)
      
      levelNodes.forEach((node, index) => {
        if (levelNum === 0) {
          // Center node
          newPositions[node.id] = { x: centerX, y: centerY }
        } else {
          // Radial positioning
          const angle = (index / levelNodes.length) * 2 * Math.PI - Math.PI / 2
          newPositions[node.id] = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          }
        }
      })
    })

    return newPositions
  }, [defaultOptions.centerX, defaultOptions.centerY, defaultOptions.spacing])

  // Tree layout algorithm for hierarchical display
  const calculateTreeLayout = useMemo(() => (nodes: ConceptNode[]) => {
    const newPositions: Record<string, Position> = {}
    const { centerX, spacing } = defaultOptions
    const nodeHeight = 100
    
    // Build tree structure
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const children = new Map<string, string[]>()
    let root: ConceptNode | null = null

    nodes.forEach(node => {
      if (!node.parentId) {
        root = node
      } else {
        if (!children.has(node.parentId)) {
          children.set(node.parentId, [])
        }
        children.get(node.parentId)?.push(node.id)
      }
    })

    if (!root) return newPositions

    // Position nodes using depth-first traversal
    const positionNode = (
      nodeId: string, 
      x: number, 
      y: number, 
      subtreeWidth: number
    ) => {
      newPositions[nodeId] = { x, y }
      
      const nodeChildren = children.get(nodeId) || []
      if (nodeChildren.length === 0) return

      const childWidth = subtreeWidth / nodeChildren.length
      let currentX = x - subtreeWidth / 2 + childWidth / 2

      nodeChildren.forEach(childId => {
        positionNode(childId, currentX, y + nodeHeight, childWidth * 0.8)
        currentX += childWidth
      })
    }

    // Calculate total width needed
    const calculateSubtreeWidth = (nodeId: string): number => {
      const nodeChildren = children.get(nodeId) || []
      if (nodeChildren.length === 0) return spacing

      const childWidths = nodeChildren.map(calculateSubtreeWidth)
      return Math.max(
        childWidths.reduce((sum, w) => sum + w, 0),
        spacing
      )
    }

    const totalWidth = calculateSubtreeWidth(root.id)
    positionNode(root.id, centerX, 100, totalWidth)

    return newPositions
  }, [defaultOptions.centerX, defaultOptions.spacing])

  // Update positions when nodes change
  useEffect(() => {
    if (nodes.length === 0) {
      setPositions({})
      return
    }

    // Choose layout algorithm based on node structure
    let newPositions: Record<string, Position>
    
    if (nodes.length <= 8 && defaultOptions.algorithm === 'radial') {
      newPositions = calculateRadialLayout(nodes)
    } else {
      newPositions = calculateTreeLayout(nodes)
    }

    setPositions(newPositions)
  }, [nodes])

  // Animation helpers
  const animateToNewPositions = (newPos: Record<string, Position>) => {
    setPositions(newPos)
  }

  return {
    positions,
    animateToNewPositions,
    layouts: {
      radial: calculateRadialLayout,
      tree: calculateTreeLayout
    }
  }
}