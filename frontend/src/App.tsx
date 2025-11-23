import { useMindMapStore } from './stores/mindMapStore'
import { MindCanvas } from './components/canvas/MindCanvas'
import { InitialPrompt } from './components/prompt/InitialPrompt'
import { ConceptNode } from './components/nodes/ConceptNode'
import { LoadingNode } from './components/nodes/LoadingNode'
import { InfoPanel } from './components/nodes/InfoPanel'
import { StatusBar } from './components/ui/StatusBar'
import { ReactBitsTest } from './components/test/ReactBitsTest'

export default function App() {
  const {
    centerConcept,
    nodes,
    isGenerating,
    loadingNodeId,
    infoPanel,
    setCenterConcept,
    expandNode,
    selectNode,
    updatePreference,
    openInfoPanel,
    closeInfoPanel
  } = useMindMapStore()

  // Handle node click interactions
  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    selectNode(nodeId)
    updatePreference(nodeId, 'click')

    if (node.isExplored) {
      // Open info panel for explored nodes
      openInfoPanel(nodeId, {
        x: node.position.x + 100,
        y: node.position.y
      })
    } else {
      // Expand unexplored nodes
      expandNode(nodeId)
      updatePreference(nodeId, 'expand')
    }
  }

  // Handle node hover for subtle preference learning
  const handleNodeHover = (nodeId: string, isHovered: boolean) => {
    if (isHovered) {
      updatePreference(nodeId, 'hover')
    }
  }

  // Handle canvas click to close panels
  const handleCanvasClick = () => {
    if (infoPanel) {
      closeInfoPanel()
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
      <MindCanvas>
        {/* Canvas Click Handler */}
        <div 
          className="absolute inset-0 pointer-events-auto z-40"
          onClick={handleCanvasClick}
        />

        {/* Render All Concept Nodes */}
        {nodes.map(node => (
          <ConceptNode
            key={node.id}
            node={node}
            onClick={handleNodeClick}
            onHover={handleNodeHover}
            isLoading={loadingNodeId === node.id}
          />
        ))}

        {/* Loading Node for Generation */}
        {isGenerating && loadingNodeId && (
          <LoadingNode 
            position={
              loadingNodeId === 'center' 
                ? { x: 600, y: 400 }
                : nodes.find(n => n.id === loadingNodeId)?.position || { x: 600, y: 400 }
            }
            label={loadingNodeId === 'center' ? 'Creating mental map...' : 'Expanding concept...'}
          />
        )}

        {/* Info Panel */}
        {infoPanel && (
          <InfoPanel
            node={nodes.find(n => n.id === infoPanel.nodeId)!}
            position={infoPanel.position}
            onClose={closeInfoPanel}
          />
        )}

        {/* Status Bar */}
        <StatusBar 
          nodeCount={nodes.length}
          isGenerating={isGenerating}
          centerConcept={centerConcept}
        />

        {/* React Bits Test (remove in production) */}
        {import.meta.env.DEV && <ReactBitsTest />}
      </MindCanvas>
    </div>
  )
}
