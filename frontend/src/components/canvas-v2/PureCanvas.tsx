import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCamera } from './hooks/useCamera'
import { usePanZoom } from './hooks/usePanZoom'
import { CameraController } from './CameraController'
import { NodesLayer } from './NodesLayer'
import { ConnectionsLayer } from '../canvas/ConnectionsLayer'
import { NodeActionMenu } from '../canvas/NodeActionMenu'
import { InfoPanel } from '../nodes/InfoPanel'
import { mediaService } from '../../services/mediaService'
import type { ConceptNode } from '../../types'

interface PureCanvasProps {
  children?: React.ReactNode
  onBackgroundClick?: () => void
}

// Mock data for demonstration - matches your existing structure
const mockNodes: ConceptNode[] = [
  {
    id: 'center',
    label: 'Active Inference AI',
    concept: 'Active Inference AI',
    isExplored: true,
    preferenceScore: 0,
    position: { x: 600, y: 400 },
    parentId: undefined,
    children: ['node-1', 'node-2', 'node-3', 'node-4'],
    createdAt: new Date(),
    contentType: 'text'
  },
  {
    id: 'node-1',
    label: 'Predictive Processing',
    concept: 'Predictive Processing',
    isExplored: false,
    preferenceScore: 0.3,
    position: { x: 400, y: 250 },
    parentId: 'center',
    children: [],
    createdAt: new Date(),
    contentType: 'text'
  },
  {
    id: 'node-2',
    label: 'Free Energy Principle',
    concept: 'Free Energy Principle',
    isExplored: false,
    preferenceScore: -0.1,
    position: { x: 800, y: 250 },
    parentId: 'center',
    children: [],
    createdAt: new Date(),
    contentType: 'text'
  },
  {
    id: 'node-3',
    label: 'Variational Inference',
    concept: 'Variational Inference',
    isExplored: false,
    preferenceScore: 0.2,
    position: { x: 450, y: 550 },
    parentId: 'center',
    children: [],
    createdAt: new Date(),
    contentType: 'text'
  },
  {
    id: 'node-4',
    label: 'Bayesian Brain',
    concept: 'Bayesian Brain Hypothesis',
    isExplored: true,
    preferenceScore: 0.5,
    position: { x: 750, y: 550 },
    parentId: 'center',
    children: ['node-4-1', 'node-4-img'],
    createdAt: new Date(),
    contentType: 'text'
  },
  {
    id: 'node-4-1',
    label: 'Hierarchical Processing',
    concept: 'Hierarchical Processing in Brain',
    isExplored: false,
    preferenceScore: 0,
    position: { x: 600, y: 700 },
    parentId: 'node-4',
    children: [],
    createdAt: new Date(),
    contentType: 'text'
  },
  {
    id: 'node-4-img',
    label: 'Brain Network Diagram',
    concept: 'Generated image for Bayesian Brain',
    isExplored: false,
    preferenceScore: 0,
    position: { x: 900, y: 700 },
    parentId: 'node-4',
    children: [],
    createdAt: new Date(),
    contentType: 'image',
    contentUrl: '/picture_test_jpg.jpg'
  }
]

export const PureCanvas = ({ children, onBackgroundClick }: PureCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const camera = useCamera({ x: -300, y: -200, zoom: 1 }) // Center the mock content
  const [nodes, setNodes] = useState<ConceptNode[]>(mockNodes)
  const [actionMenu, setActionMenu] = useState<{ nodeId: string; position: { x: number; y: number }; isVisible: boolean } | null>(null)
  const [infoPanel, setInfoPanel] = useState<{ nodeId: string; position: { x: number; y: number } } | null>(null)
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null)

  // Pan/zoom gesture handling
  const { isPanning } = usePanZoom(containerRef, camera, {
    onPanStart: () => {
      // Close any open menus when panning starts
      setActionMenu(null)
      setInfoPanel(null)
    }
  })

  // Mock node interactions
  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || loadingNodeId) return

    if (!node.isExplored) {
      // Show action menu for unexplored nodes
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        // Calculate screen position for the menu
        const screenX = node.position.x * camera.camera.zoom + camera.camera.x + rect.left + 100
        const screenY = node.position.y * camera.camera.zoom + camera.camera.y + rect.top
        setActionMenu({ nodeId, position: { x: screenX, y: screenY }, isVisible: true })
      }
    }
  }

  const handleNodeRightClick = (nodeId: string, position: { x: number; y: number }) => {
    setActionMenu({ nodeId, position, isVisible: true })
    setInfoPanel(null)
  }

  const handleNodeHover = (nodeId: string, isHovered: boolean) => {
    if (isHovered && !actionMenu) {
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        // You could show info panel on hover here
      }
    }
  }

  const handleGenerateImage = async (nodeId: string) => {
    console.log('🎨 Real API: Generating image for node', nodeId)
    setActionMenu(null)
    
    const parentNode = nodes.find(n => n.id === nodeId)
    if (!parentNode) return

    // Create temporary loading node
    const tempImageNode = {
      id: `${nodeId}-image-${Date.now()}`,
      label: `Generating Image...`,
      concept: `Generating image for ${parentNode.concept}`,
      isExplored: false,
      preferenceScore: 0,
      position: { 
        x: parentNode.position.x + 200, 
        y: parentNode.position.y + 100 
      },
      parentId: nodeId,
      children: [],
      createdAt: new Date(),
      contentType: 'image' as const,
      contentUrl: null
    }
    
    // Add temporary loading node
    setNodes(prev => [...prev, tempImageNode])
    setLoadingNodeId(tempImageNode.id)

    try {
      // Call real API
      const result = await mediaService.generateImage(nodeId, parentNode.concept)
      
      // Update the node with the real generated image
      setNodes(prev => prev.map(node => 
        node.id === tempImageNode.id 
          ? {
              ...node,
              label: `Image: ${parentNode.label}`,
              contentUrl: result.localUrl,
              isExplored: false // Make it clickable
            }
          : node
      ))
      
      console.log('✅ Image generation completed and node updated')
      
    } catch (error) {
      console.error('❌ Image generation failed:', error)
      
      // Update node to show error state
      setNodes(prev => prev.map(node => 
        node.id === tempImageNode.id 
          ? {
              ...node,
              label: `Image Generation Failed`,
              concept: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          : node
      ))
    } finally {
      setLoadingNodeId(null)
    }
  }

  const handleGenerateVideo = (nodeId: string) => {
    console.log('Mock: Generating video for node', nodeId)
    setActionMenu(null)
    
    // Mock video generation - add a new video node
    const parentNode = nodes.find(n => n.id === nodeId)
    if (parentNode) {
      const videoNode = {
        id: `${nodeId}-video-${Date.now()}`,
        label: `Video: ${parentNode.label}`,
        concept: `Generated video for ${parentNode.concept}`,
        isExplored: false,
        preferenceScore: 0,
        position: { 
          x: parentNode.position.x - 200, 
          y: parentNode.position.y + 100 
        },
        parentId: nodeId,
        children: [],
        createdAt: new Date(),
        contentType: 'video' as const,
        contentUrl: '/video_test.mp4'
      }
      
      setNodes(prev => [...prev, videoNode])
    }
  }

  const handleGenerateNodes = (nodeId: string) => {
    console.log('Mock: Expanding node', nodeId)
    setActionMenu(null)
    
    // Mock node expansion
    setLoadingNodeId(nodeId)
    setTimeout(() => {
      const parentNode = nodes.find(n => n.id === nodeId)
      if (parentNode) {
        // Create 3 child nodes
        const childNodes = [
          {
            id: `${nodeId}-child-1-${Date.now()}`,
            label: `${parentNode.label} - Theory`,
            concept: `Theoretical aspects of ${parentNode.concept}`,
            isExplored: false,
            preferenceScore: 0.1,
            position: { 
              x: parentNode.position.x - 150, 
              y: parentNode.position.y + 150 
            },
            parentId: nodeId,
            children: [],
            createdAt: new Date(),
            contentType: 'text' as const
          },
          {
            id: `${nodeId}-child-2-${Date.now()}`,
            label: `${parentNode.label} - Practice`,
            concept: `Practical applications of ${parentNode.concept}`,
            isExplored: false,
            preferenceScore: 0.3,
            position: { 
              x: parentNode.position.x, 
              y: parentNode.position.y + 150 
            },
            parentId: nodeId,
            children: [],
            createdAt: new Date(),
            contentType: 'text' as const
          },
          {
            id: `${nodeId}-child-3-${Date.now()}`,
            label: `${parentNode.label} - Examples`,
            concept: `Examples and case studies of ${parentNode.concept}`,
            isExplored: false,
            preferenceScore: 0.2,
            position: { 
              x: parentNode.position.x + 150, 
              y: parentNode.position.y + 150 
            },
            parentId: nodeId,
            children: [],
            createdAt: new Date(),
            contentType: 'text' as const
          }
        ]
        
        setNodes(prev => [
          // Update parent node to be explored
          ...prev.map(n => 
            n.id === nodeId 
              ? { ...n, isExplored: true, children: childNodes.map(c => c.id) }
              : n
          ),
          // Add child nodes
          ...childNodes
        ])
      }
      setLoadingNodeId(null)
    }, 1500)
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only trigger if clicking the background (not dragging)
    if (isPanning) return
    
    // Check if we clicked on the background (not a child element)
    if (e.target === e.currentTarget) {
      setActionMenu(null)
      setInfoPanel(null)
      onBackgroundClick?.()
    }
  }

  // Auto-fit content on mount
  useEffect(() => {
    if (nodes.length > 0) {
      const bounds = nodes.reduce((acc, node) => {
        return {
          minX: Math.min(acc.minX, node.position.x - 100),
          maxX: Math.max(acc.maxX, node.position.x + 100),
          minY: Math.min(acc.minY, node.position.y - 50),
          maxY: Math.max(acc.maxY, node.position.y + 50)
        }
      }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

      const contentBounds = {
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY
      }

      // Fit to view with some delay for demo effect
      setTimeout(() => {
        camera.fitToView(contentBounds)
      }, 500)
    }
  }, [camera, nodes.length])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-white overflow-hidden select-none"
      onMouseDown={(e) => {
        // Prevent click events when starting to pan
        e.preventDefault()
      }}
      onClick={handleBackgroundClick}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Camera Controls */}
      <CameraController camera={camera} />
      
      {/* Loading indicator */}
      <AnimatePresence>
        {loadingNodeId && (
          <motion.div 
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">Expanding knowledge...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with camera transform */}
      <div 
        className="absolute inset-0"
        style={{
          transform: `translate(${camera.camera.x}px, ${camera.camera.y}px) scale(${camera.camera.zoom})`,
          transformOrigin: '0 0',
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Connections Layer - renders behind nodes */}
        <ConnectionsLayer nodes={nodes} />
        
        {/* Nodes Layer - renders all interactive nodes */}
        <NodesLayer 
          nodes={nodes}
          onNodeClick={handleNodeClick}
          onNodeRightClick={handleNodeRightClick}
          onNodeHover={handleNodeHover}
          loadingNodeId={loadingNodeId}
        />
        
        {/* Custom children (like additional overlays) */}
        {children}
      </div>

      {/* UI overlays that don't scale with camera */}
      <AnimatePresence>
        {actionMenu && (
          <NodeActionMenu
            nodeId={actionMenu.nodeId}
            position={actionMenu.position}
            isVisible={actionMenu.isVisible}
            onClose={() => setActionMenu(null)}
            onAction={(action) => {
              switch (action) {
                case 'generate-nodes':
                  handleGenerateNodes(actionMenu.nodeId)
                  break
                case 'create-image':
                  handleGenerateImage(actionMenu.nodeId)
                  break
                case 'create-video':
                  handleGenerateVideo(actionMenu.nodeId)
                  break
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {infoPanel && (
          <InfoPanel
            nodeId={infoPanel.nodeId}
            position={infoPanel.position}
            onClose={() => setInfoPanel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}