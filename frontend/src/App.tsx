import { useMindMapStore } from './stores/mindMapStore'
import { MindCanvas } from './components/canvas/MindCanvas'
import { ConnectionsLayer } from './components/canvas/ConnectionsLayer'
import { NodeActionMenu } from './components/canvas/NodeActionMenu'
import { InitialPrompt } from './components/prompt/InitialPrompt'
import { ConceptNode } from './components/nodes/ConceptNode'
import { LoadingNode } from './components/nodes/LoadingNode'
import { InfoPanel } from './components/nodes/InfoPanel'
import { StatusBar } from './components/ui/StatusBar'
import type { ConceptNode as ConceptNodeType } from './types'

export default function App() {
  const {
    centerConcept,
    nodes,
    isGenerating,
    selectedNodeId,
    infoPanel,
    actionMenu,
    connectionStatus,
    lastError,
    setCenterConcept,
    expandNode,
    selectNode,
    updatePreference,
    openInfoPanel,
    closeInfoPanel,
    showActionMenu,
    hideActionMenu,
    generateImage,
    generateVideo,
    clearError,
    testConnection
  } = useMindMapStore()

  // Smart panel positioning logic - like arrow positioning from InitialPrompt
  const calculateSmartPanelPosition = (
    nodePosition: { x: number; y: number },
    panelWidth: number,
    panelHeight: number,
    node?: ConceptNodeType
  ) => {
    const padding = 20
    let arrowOffset = 50 // Distance from node like arrow in InitialPrompt
    
    // Adjust offset based on node type and size
    if (node) {
      const isCenterNode = node.id === 'center'
      const isMediaNode = node.contentType === 'image' || node.contentType === 'video'
      
      if (isCenterNode) {
        arrowOffset = 120 // Larger center node needs more space
      } else if (isMediaNode) {
        // Use expected dimensions from metadata or default media sizes
        const width = node.metadata?.expectedWidth || 180
        arrowOffset = width / 2 + 30 // Half node width + some padding
      }
    }
    
    // Try to position panel to the right of the node first
    let x = nodePosition.x + arrowOffset
    let y = nodePosition.y - panelHeight / 2
    
    // If panel would go off right edge, position to the left
    if (x + panelWidth + padding > window.innerWidth) {
      x = nodePosition.x - arrowOffset - panelWidth
    }
    
    // If panel would go off left edge, center horizontally
    if (x < padding) {
      x = nodePosition.x - panelWidth / 2
    }
    
    // Adjust vertical position if needed
    if (y < padding) {
      y = padding
    } else if (y + panelHeight + padding > window.innerHeight) {
      y = window.innerHeight - panelHeight - padding
    }
    
    return { x: Math.max(padding, x), y: Math.max(padding, y) }
  }

  // Handle node click interactions
  const handleNodeClick = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    // Select node immediately (for shiny text effect) - NO loading state
    selectNode(nodeId)
    
    // Update preference asynchronously (don't await, don't block UI)
    updatePreference(nodeId, 'click').catch(error => {
      console.error('Failed to update click preference:', error)
    })

    // Check if this is a completed media node (has content)
    const isCompletedMedia = (node.contentType === 'image' || node.contentType === 'video') && node.contentUrl

    if (node.isExplored || isCompletedMedia) {
      // Open info panel for explored nodes or completed media - smart positioning like arrow
      const panelPosition = calculateSmartPanelPosition(node.position, 350, 400)
      openInfoPanel(nodeId, panelPosition)
    } else {
      // Show action menu for unexplored text nodes - smart positioning like arrow
      const menuPosition = calculateSmartPanelPosition(node.position, 180, 140, node)
      showActionMenu(nodeId, menuPosition)
    }
  }

  // Handle action menu selections
  const handleActionMenuAction = async (action: 'generate-nodes' | 'create-image' | 'create-video') => {
    if (!actionMenu) return

    const nodeId = actionMenu.nodeId

    // CRITICAL: Explicitly ensure node is selected BEFORE action executes
    // This guarantees shiny text appears when action is clicked
    selectNode(nodeId)

    try {
      // CRITICAL: Keep node selected to maintain shiny text effect
      // Don't clear selectedNodeId - it should stay set after action completes
      switch (action) {
        case 'generate-nodes':
          await expandNode(nodeId)
          await updatePreference(nodeId, 'expand')
          break
        case 'create-image':
          await generateImage(nodeId)
          break
        case 'create-video':
          await generateVideo(nodeId)
          break
      }
      // CRITICAL: Re-assert selection after action completes to ensure shiny text persists
      selectNode(nodeId)
    } catch (error) {
      console.error(`Failed to execute action ${action}:`, error)
      // Even on error, keep node selected
      selectNode(nodeId)
    }
  }

  // Handle node hover - disabled to prevent render thrashing
  // Hover events trigger too frequently and cause connections to flicker
  const handleNodeHover = () => {
    // No-op: hover tracking disabled for performance
    // Only track meaningful interactions (click, expand)
  }

  // Handle canvas click to close panels
  const handleCanvasClick = () => {
    if (infoPanel) {
      closeInfoPanel()
    }
    if (actionMenu) {
      hideActionMenu()
    }
  }

  // Show initial prompt if no center concept is set
  if (!centerConcept) {
    return (
      <div className="w-full h-screen">
        <InitialPrompt onSubmit={setCenterConcept} />
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen">
      {/* Connection Status Indicator */}
      {connectionStatus === 'error' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <span className="text-sm font-medium">Backend Connection Error</span>
          {lastError && <span className="text-xs">({lastError})</span>}
          <button 
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
          <button 
            onClick={testConnection}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. The Infinite Canvas Layer */}
      <MindCanvas onBackgroundClick={handleCanvasClick}>
        
        {/* Z-Index Layering (inside camera-synced transform):
            z-[5]  = ConnectionsLayer (arrows/lines behind nodes)
            z-[15] = ConceptNodes & LoadingNode (interactive elements on top)
        */}
        <ConnectionsLayer nodes={nodes} />

        {/* Nodes live INSIDE MindCanvas to move with the camera */}
        {nodes.map(node => (
          <ConceptNode
            key={node.id}
            node={node}
            onClick={handleNodeClick}
            onHover={handleNodeHover}
            selectedNodeId={selectedNodeId}
          />
        ))}

        {/* Loading Node for INITIAL center concept generation only */}
        {isGenerating && nodes.length === 0 && (
          <LoadingNode 
            position={{ x: 600, y: 400 }}
            label={centerConcept}
          />
        )}

      </MindCanvas>

      {/* 2. The Screen UI Layer (Fixed position, outside MindCanvas) */}
      <StatusBar 
        nodeCount={nodes.length}
        isGenerating={isGenerating}
        centerConcept={centerConcept}
      />

      {/* InfoPanel in screen space (fixed position) */}
      {infoPanel && (
        <InfoPanel
          node={nodes.find(n => n.id === infoPanel.nodeId)!}
          position={infoPanel.position}
          onClose={closeInfoPanel}
        />
      )}

      {/* Action Menu in screen space (fixed position) */}
      {actionMenu && (
        <NodeActionMenu
          nodeId={actionMenu.nodeId}
          position={actionMenu.position}
          isVisible={actionMenu.isVisible}
          onAction={handleActionMenuAction}
          onClose={hideActionMenu}
        />
      )}

    </div>
  )
}
