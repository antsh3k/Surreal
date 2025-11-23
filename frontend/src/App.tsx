import { useMindMapStore } from './stores/mindMapStore'
import { MindCanvas } from './components/canvas/MindCanvas'
import { ConnectionsLayer } from './components/canvas/ConnectionsLayer'
import { NodeActionMenu } from './components/canvas/NodeActionMenu'
import { InitialPrompt } from './components/prompt/InitialPrompt'
import { ConceptNode } from './components/nodes/ConceptNode'
import { LoadingNode } from './components/nodes/LoadingNode'
import { InfoPanel } from './components/nodes/InfoPanel'
import { StatusBar } from './components/ui/StatusBar'
import { ReactBitsTest } from './components/test/ReactBitsTest'
import { ApiConnectionTest } from './components/test/ApiConnectionTest'

export default function App() {
  const {
    centerConcept,
    nodes,
    isGenerating,
    loadingNodeId,
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

  // Handle node click interactions
  const handleNodeClick = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    selectNode(nodeId)
    
    // Update preference asynchronously
    try {
      await updatePreference(nodeId, 'click')
    } catch (error) {
      console.error('Failed to update click preference:', error)
    }

    if (node.isExplored) {
      // Open info panel for explored nodes - position it to the right of the node
      openInfoPanel(nodeId, {
        x: Math.min(window.innerWidth - 350, node.position.x + 180), // Keep panel on screen
        y: Math.max(50, node.position.y - 50) // Position above the node
      })
    } else {
      // Show action menu for unexplored nodes
      showActionMenu(nodeId, {
        x: Math.min(window.innerWidth - 200, node.position.x + 100),
        y: Math.max(50, node.position.y - 50)
      })
    }
  }

  // Handle action menu selections
  const handleActionMenuAction = async (action: 'generate-nodes' | 'create-image' | 'create-video') => {
    if (!actionMenu) return

    const nodeId = actionMenu.nodeId

    try {
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
    } catch (error) {
      console.error(`Failed to execute action ${action}:`, error)
    }
  }

  // Handle node hover - disabled to prevent render thrashing
  // Hover events trigger too frequently and cause connections to flicker
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNodeHover = async (nodeId: string, isHovered: boolean) => {
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
            isLoading={loadingNodeId === node.id}
          />
        ))}

        {/* Loading Node for INITIAL generation only (when loadingNodeId is 'center') */}
        {isGenerating && loadingNodeId === 'center' && (
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

      {/* Debug Tools */}
      {import.meta.env.DEV && (
        <>
          <ReactBitsTest />
          <ApiConnectionTest />
        </>
      )}
    </div>
  )
}
