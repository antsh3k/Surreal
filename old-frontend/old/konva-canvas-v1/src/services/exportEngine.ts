import Konva from 'konva'
import type { ConceptNodeData, ConnectionData } from '../types'

export class ExportEngine {
  static async exportToImage(stage: Konva.Stage, format: 'png' | 'jpeg' = 'png'): Promise<string> {
    try {
      // Hide UI layers temporarily
      const uiLayer = stage.findOne('.ui-layer')
      const originalUIVisibility = uiLayer?.visible()
      if (uiLayer) {
        uiLayer.visible(false)
      }

      // Export at high resolution for crisp results
      const dataURL = stage.toDataURL({
        mimeType: `image/${format}`,
        quality: 0.9,
        pixelRatio: 2 // 2x resolution
      })

      // Restore UI layer visibility
      if (uiLayer && originalUIVisibility !== undefined) {
        uiLayer.visible(originalUIVisibility)
      }

      return dataURL
    } catch (error) {
      console.error('Failed to export to image:', error)
      throw new Error('Image export failed')
    }
  }

  static async exportToJSON(nodes: ConceptNodeData[], connections: ConnectionData[]): Promise<string> {
    try {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        metadata: {
          nodeCount: nodes.length,
          connectionCount: connections.length,
          exportedBy: 'Surreal Mental Maps',
        },
        nodes: nodes.map(node => ({
          ...node,
          // Clean up any runtime-only properties
          generatedContent: node.generatedContent || []
        })),
        connections,
        // Include preference data for reimport
        preferences: {
          // This would include learned preferences if needed
        }
      }
      
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export to JSON:', error)
      throw new Error('JSON export failed')
    }
  }

  static async downloadImage(stage: Konva.Stage, filename = 'mental-map'): Promise<void> {
    try {
      const dataURL = await this.exportToImage(stage, 'png')
      
      // Create download link
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = dataURL
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download image:', error)
      throw error
    }
  }

  static async downloadJSON(nodes: ConceptNodeData[], connections: ConnectionData[], filename = 'mental-map'): Promise<void> {
    try {
      const jsonData = await this.exportToJSON(nodes, connections)
      
      // Create blob and download link
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.download = `${filename}.json`
      link.href = url
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up object URL
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download JSON:', error)
      throw error
    }
  }

  static async copyToClipboard(stage: Konva.Stage): Promise<void> {
    try {
      const dataURL = await this.exportToImage(stage, 'png')
      
      // Convert data URL to blob
      const response = await fetch(dataURL)
      const blob = await response.blob()
      
      // Copy to clipboard using modern Clipboard API
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
      } else {
        throw new Error('Clipboard API not supported')
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      throw new Error('Clipboard copy failed')
    }
  }

  // Utility method to get canvas bounds for optimal export framing
  static getCanvasBounds(nodes: ConceptNodeData[]): { x: number; y: number; width: number; height: number } {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    nodes.forEach(node => {
      const nodeLeft = node.position.x
      const nodeTop = node.position.y
      const nodeRight = node.position.x + node.size.width
      const nodeBottom = node.position.y + node.size.height

      minX = Math.min(minX, nodeLeft)
      minY = Math.min(minY, nodeTop)
      maxX = Math.max(maxX, nodeRight)
      maxY = Math.max(maxY, nodeBottom)
    })

    // Add padding
    const padding = 50
    return {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2)
    }
  }

  // Export only visible viewport
  static async exportViewport(stage: Konva.Stage): Promise<string> {
    try {
      const viewport = {
        x: -stage.x() / stage.scaleX(),
        y: -stage.y() / stage.scaleY(),
        width: stage.width() / stage.scaleX(),
        height: stage.height() / stage.scaleY()
      }

      return stage.toDataURL({
        mimeType: 'image/png',
        quality: 0.9,
        pixelRatio: 2,
        x: viewport.x,
        y: viewport.y,
        width: viewport.width,
        height: viewport.height
      })
    } catch (error) {
      console.error('Failed to export viewport:', error)
      throw new Error('Viewport export failed')
    }
  }
}