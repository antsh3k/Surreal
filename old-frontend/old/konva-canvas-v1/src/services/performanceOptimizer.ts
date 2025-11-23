import Konva from 'konva'
import type { ConceptNodeData } from '../types'

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private renderQueue: Set<string> = new Set()
  private isRendering = false
  private frameCount = 0
  private lastFrameTime = performance.now()

  static getInstance() {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Batch rendering updates for better performance
  scheduleRender(nodeId: string, callback?: () => void) {
    this.renderQueue.add(nodeId)
    
    if (!this.isRendering) {
      this.isRendering = true
      requestAnimationFrame(() => {
        this.performBatchRender()
        this.isRendering = false
        callback?.()
      })
    }
  }

  private performBatchRender() {
    // Process all queued renders in a single frame
    this.renderQueue.forEach(() => {
      // Individual node updates would go here
      // For now, this is handled by Konva's built-in batching
    })
    this.renderQueue.clear()
  }

  // Viewport culling - only render visible nodes
  cullInvisibleNodes(stage: Konva.Stage, nodes: ConceptNodeData[]): ConceptNodeData[] {
    const viewport = this.getViewportBounds(stage)
    
    return nodes.filter(node => this.isNodeInViewport(node, viewport))
  }

  private getViewportBounds(stage: Konva.Stage) {
    const scale = stage.scaleX()
    return {
      x: -stage.x() / scale,
      y: -stage.y() / scale,
      width: stage.width() / scale,
      height: stage.height() / scale,
    }
  }

  private isNodeInViewport(node: ConceptNodeData, viewport: any): boolean {
    const buffer = 100 // Add buffer for smooth scrolling
    
    return (
      node.position.x + node.size.width >= viewport.x - buffer &&
      node.position.x <= viewport.x + viewport.width + buffer &&
      node.position.y + node.size.height >= viewport.y - buffer &&
      node.position.y <= viewport.y + viewport.height + buffer
    )
  }

  // Level of detail optimization - reduce detail for distant nodes
  getLevelOfDetail(stage: Konva.Stage): 'high' | 'medium' | 'low' {
    const scale = stage.scaleX()
    
    if (scale > 1.5) return 'high'
    if (scale > 0.8) return 'medium'
    return 'low'
  }

  // Memory management for large node counts
  optimizeMemoryUsage(nodes: ConceptNodeData[]): ConceptNodeData[] {
    // For very large datasets, we might need to virtualize or paginate
    if (nodes.length > 1000) {
      console.warn(`Large node count detected: ${nodes.length}. Consider implementing virtualization.`)
    }
    
    return nodes
  }

  // Performance monitoring
  measureFrameRate(): number {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastFrameTime >= 1000) {
      const fps = this.frameCount
      this.frameCount = 0
      this.lastFrameTime = now
      return fps
    }
    
    return 60 // Default assumption
  }

  // Check if device can handle complex animations
  shouldUseReducedMotion(): boolean {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true
    }
    
    // Check for low-end device indicators
    const isLowEnd = 
      navigator.hardwareConcurrency <= 2 || // Low CPU cores
      (navigator as any).deviceMemory <= 2 || // Low RAM
      /Android.*(Mobile|Phone)/i.test(navigator.userAgent) // Mobile Android
    
    return isLowEnd
  }

  // Optimize Konva stage settings for performance
  optimizeStageSettings(stage: Konva.Stage): void {
    // Enable pixel ratio optimization
    const ratio = Math.min(window.devicePixelRatio, 2) // Cap at 2x for performance
    stage.setAttr('pixelRatio', ratio)
    
    // Optimize hit detection
    stage.listening(true) // Ensure events still work
    
    // Enable layer caching if beneficial
    const layers = stage.getLayers()
    layers.forEach(layer => {
      if (layer.getChildren().length > 20) {
        layer.cache()
      }
    })
  }

  // Throttle expensive operations
  throttle<T extends any[]>(func: (...args: T) => void, limit: number) {
    let inThrottle: boolean
    return function(this: any, ...args: T) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        window.setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Debounce rapid operations like zoom/pan
  debounce<T extends any[]>(func: (...args: T) => void, delay: number) {
    let timeoutId: number
    return function(this: any, ...args: T) {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => func.apply(this, args), delay)
    }
  }

  // Memory usage estimation
  estimateMemoryUsage(nodes: ConceptNodeData[]): number {
    // Rough estimation in MB
    const nodeSize = 1000 // Average bytes per node (including Konva objects)
    return (nodes.length * nodeSize) / (1024 * 1024)
  }

  // Performance recommendations based on current state
  getPerformanceRecommendations(nodes: ConceptNodeData[], stage?: Konva.Stage): string[] {
    const recommendations: string[] = []
    
    if (nodes.length > 100) {
      recommendations.push('Consider implementing viewport culling for better performance')
    }
    
    if (nodes.length > 500) {
      recommendations.push('Large node count detected. Enable virtualization.')
    }
    
    if (stage && stage.scaleX() < 0.3) {
      recommendations.push('Very zoomed out. Consider level-of-detail optimization.')
    }
    
    if (this.shouldUseReducedMotion()) {
      recommendations.push('Reduced motion mode recommended for this device')
    }
    
    const memUsage = this.estimateMemoryUsage(nodes)
    if (memUsage > 50) {
      recommendations.push(`High memory usage estimated: ${memUsage.toFixed(1)}MB`)
    }
    
    return recommendations
  }
}