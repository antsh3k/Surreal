import { ConceptNode, Connection } from '../types'

export class SVGExportService {
  static exportToSVG(svgElement: SVGSVGElement): string {
    // Clone the SVG to avoid modifying original
    const clonedSVG = svgElement.cloneNode(true) as SVGSVGElement
    
    // Add necessary styles inline
    const styleElement = document.createElement('style')
    styleElement.textContent = `
      .concept-node { font-family: Inter, system-ui, sans-serif; }
      .concept-node-neutral { fill: white; stroke: #E5E5E5; stroke-width: 1; }
      .concept-node-uncertain { fill: white; stroke: #9CA3AF; stroke-width: 2; stroke-dasharray: 5,5; }
      .concept-node-liked { fill: #F0FDF4; stroke: #10B981; stroke-width: 2; }
      .concept-node-uncertain-hint { fill: #FEF3C7; stroke: #F59E0B; stroke-width: 2; }
      text { font-size: 14px; font-weight: 500; }
    `
    clonedSVG.insertBefore(styleElement, clonedSVG.firstChild)
    
    // Serialize to string
    const serializer = new XMLSerializer()
    return serializer.serializeToString(clonedSVG)
  }

  static exportToPNG(svgElement: SVGSVGElement, scale = 2): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      const svgData = this.exportToSVG(svgElement)
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    })
  }

  static exportToJSON(nodes: ConceptNode[], connections: Connection[]): string {
    const exportData = {
      version: '1.0',
      format: 'surreal-mental-map',
      timestamp: new Date().toISOString(),
      data: { nodes, connections },
      metadata: {
        nodeCount: nodes.length,
        connectionCount: connections.length,
        exportedFrom: 'Pure React Implementation'
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  static async exportMap(
    svgElement: SVGSVGElement, 
    nodes: ConceptNode[], 
    connections: Connection[], 
    format: 'svg' | 'png' | 'json',
    filename: string
  ) {
    switch (format) {
      case 'svg': {
        const svgContent = this.exportToSVG(svgElement)
        this.downloadFile(svgContent, `${filename}.svg`, 'image/svg+xml')
        break
      }
      case 'png': {
        const pngDataUrl = await this.exportToPNG(svgElement)
        const link = document.createElement('a')
        link.href = pngDataUrl
        link.download = `${filename}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        break
      }
      case 'json': {
        const jsonContent = this.exportToJSON(nodes, connections)
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json')
        break
      }
    }
  }
}