import { useState, useEffect, useMemo } from 'react'
import type { ConceptNodeData } from '../types'

export const useOrganicLayout = (nodes: ConceptNodeData[]) => {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  
  // Organic clustering algorithm
  const calculateOrganicPositions = useMemo(() => (nodes: ConceptNodeData[]) => {
    const newPositions: Record<string, { x: number; y: number }> = {}
    
    if (nodes.length === 0) return newPositions
    
    // Find root node (topic center)
    const rootNode = nodes.find(n => !n.parentId) || nodes[0]
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    // Place root in center with slight organic offset
    newPositions[rootNode.id] = {
      x: centerX + (Math.random() - 0.5) * 20,
      y: centerY + (Math.random() - 0.5) * 20
    }
    
    // Group nodes by generation (distance from root)
    const generations = new Map<number, ConceptNodeData[]>()
    
    const calculateGeneration = (node: ConceptNodeData, gen = 0): number => {
      if (!node.parentId) return 0
      const parent = nodes.find(n => n.id === node.parentId)
      return parent ? calculateGeneration(parent, gen + 1) + 1 : gen
    }
    
    nodes.forEach(node => {
      const generation = calculateGeneration(node)
      if (!generations.has(generation)) {
        generations.set(generation, [])
      }
      generations.get(generation)!.push(node)
    })
    
    // Position each generation organically
    Array.from(generations.entries()).forEach(([gen, genNodes]) => {
      if (gen === 0) return // Root already positioned
      
      const radius = 120 + gen * 100 // Increasing radius per generation
      const angleStep = (Math.PI * 2) / genNodes.length
      
      genNodes.forEach((node, index) => {
        // Base angle with organic variation
        const baseAngle = index * angleStep + (Math.random() - 0.5) * 0.5
        const organicRadius = radius + (Math.random() - 0.5) * 40
        
        // Create clusters around parent nodes when possible
        const parentPos = node.parentId ? newPositions[node.parentId] : null
        
        if (parentPos && gen > 1) {
          // Position relative to parent with organic spread
          const parentAngle = Math.atan2(
            parentPos.y - centerY, 
            parentPos.x - centerX
          )
          const spreadAngle = parentAngle + (Math.random() - 0.5) * Math.PI * 0.8
          const spreadDistance = 80 + Math.random() * 60
          
          newPositions[node.id] = {
            x: parentPos.x + Math.cos(spreadAngle) * spreadDistance,
            y: parentPos.y + Math.sin(spreadAngle) * spreadDistance
          }
        } else {
          // Radial positioning with organic variation
          newPositions[node.id] = {
            x: centerX + Math.cos(baseAngle) * organicRadius,
            y: centerY + Math.sin(baseAngle) * organicRadius
          }
        }
      })
    })
    
    // Apply force simulation for organic spacing
    for (let iteration = 0; iteration < 30; iteration++) {
      Object.keys(newPositions).forEach(nodeId => {
        const pos = newPositions[nodeId]
        let fx = 0, fy = 0
        
        // Repulsion from other nodes
        Object.keys(newPositions).forEach(otherId => {
          if (nodeId === otherId) return
          
          const otherPos = newPositions[otherId]
          const dx = pos.x - otherPos.x
          const dy = pos.y - otherPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 100 && distance > 0) {
            const force = (100 - distance) / distance * 0.5
            fx += dx * force
            fy += dy * force
          }
        })
        
        // Apply force with damping
        newPositions[nodeId] = {
          x: pos.x + fx * 0.1,
          y: pos.y + fy * 0.1
        }
      })
    }
    
    return newPositions
  }, [])
  
  // Update positions when nodes change
  useEffect(() => {
    const newPositions = calculateOrganicPositions(nodes)
    setPositions(newPositions)
  }, [nodes, calculateOrganicPositions])
  
  // Animated position transitions
  const animateToNewLayout = (newNodes: ConceptNodeData[]) => {
    const newPositions = calculateOrganicPositions(newNodes)
    
    // Smooth transition using RAF
    const startPositions = { ...positions }
    const startTime = performance.now()
    const duration = 800
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for organic feel
      const easedProgress = progress * progress * (3 - 2 * progress)
      
      const interpolatedPositions: Record<string, { x: number; y: number }> = {}
      
      Object.keys(newPositions).forEach(nodeId => {
        const start = startPositions[nodeId] || newPositions[nodeId]
        const end = newPositions[nodeId]
        
        interpolatedPositions[nodeId] = {
          x: start.x + (end.x - start.x) * easedProgress,
          y: start.y + (end.y - start.y) * easedProgress
        }
      })
      
      setPositions(interpolatedPositions)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }
  
  return {
    organicPositions: positions,
    animateToNewLayout
  }
}