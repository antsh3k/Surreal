import { ConceptNode } from '../nodes/ConceptNode'
import type { ConceptNode as ConceptNodeType } from '../../types'

interface NodesLayerProps {
  nodes: ConceptNodeType[]
  onNodeClick: (nodeId: string) => void
  onNodeRightClick: (nodeId: string, position: { x: number; y: number }) => void
  onNodeHover?: (nodeId: string, isHovered: boolean) => void
  loadingNodeId?: string | null
}

export const NodesLayer = ({ 
  nodes, 
  onNodeClick, 
  onNodeRightClick, 
  onNodeHover,
  loadingNodeId 
}: NodesLayerProps) => {
  const handleNodeClick = (nodeId: string) => {
    onNodeClick(nodeId)
  }

  const handleContextMenu = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Get position relative to viewport (not transformed canvas)
    onNodeRightClick(nodeId, { x: e.clientX, y: e.clientY })
  }

  const handleNodeHover = (nodeId: string, isHovered: boolean) => {
    onNodeHover?.(nodeId, isHovered)
  }

  return (
    <div className="absolute inset-0">
      {nodes.map(node => (
        <div
          key={node.id}
          onContextMenu={(e) => handleContextMenu(node.id, e)}
          className="absolute"
        >
          <ConceptNode 
            node={node}
            onClick={handleNodeClick}
            onHover={handleNodeHover}
            isLoading={loadingNodeId === node.id}
            className="transform transition-transform duration-200 hover:scale-105"
          />
        </div>
      ))}
    </div>
  )
}