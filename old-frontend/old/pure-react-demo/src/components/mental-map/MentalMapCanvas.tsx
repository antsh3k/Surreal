import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConceptNode as ConceptNodeType, Connection, Position, ViewBox } from '../../types'
import { useLayout } from '../../hooks/useLayout'
import ConceptNode from './ConceptNode'
import ConnectionLine from './ConnectionLine'

interface MentalMapCanvasProps {
  nodes: ConceptNodeType[]
  connections: Connection[]
  onNodeClick: (nodeId: string) => void
  onContextMenu: (nodeId: string, position: Position) => void
}

const MentalMapCanvas = ({ nodes, connections, onNodeClick, onContextMenu }: MentalMapCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const { positions } = useLayout(nodes)
  
  const [viewBox, setViewBox] = useState<ViewBox>({
    x: -100,
    y: -100,
    width: 1400,
    height: 1000
  })

  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }))
      
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    // Try to prevent default, but handle gracefully if it fails
    try {
      e.preventDefault()
    } catch (err) {
      // Ignore preventDefault errors in passive event listeners
    }
    
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9
    const newWidth = viewBox.width * zoomFactor
    const newHeight = viewBox.height * zoomFactor
    
    // Keep zoom centered on mouse position
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const scaleX = mouseX / rect.width
      const scaleY = mouseY / rect.height
      
      setViewBox({
        x: viewBox.x + (viewBox.width - newWidth) * scaleX,
        y: viewBox.y + (viewBox.height - newHeight) * scaleY,
        width: newWidth,
        height: newHeight
      })
    }
  }

  return (
    <div className="w-full h-screen bg-white overflow-hidden relative">
      <motion.svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className={`${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background grid pattern */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connection lines layer */}
        <g className="connections">
          <AnimatePresence>
            {connections.map(connection => {
              const fromPos = positions[connection.from]
              const toPos = positions[connection.to]
              if (!fromPos || !toPos) return null
              
              return (
                <ConnectionLine
                  key={`${connection.from}-${connection.to}`}
                  connection={connection}
                  fromPosition={fromPos}
                  toPosition={toPos}
                />
              )
            })}
          </AnimatePresence>
        </g>

        {/* Nodes layer */}
        <g className="nodes">
          <AnimatePresence>
            {nodes.map(node => {
              const position = positions[node.id]
              if (!position) return null
              
              return (
                <ConceptNode
                  key={node.id}
                  node={node}
                  position={position}
                  onNodeClick={onNodeClick}
                  onContextMenu={onContextMenu}
                />
              )
            })}
          </AnimatePresence>
        </g>
      </motion.svg>

      {/* Zoom controls overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setViewBox(prev => ({ ...prev, width: prev.width * 0.8, height: prev.height * 0.8 }))}
          className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white shadow-sm"
        >
          Zoom In
        </button>
        <button
          onClick={() => setViewBox(prev => ({ ...prev, width: prev.width * 1.25, height: prev.height * 1.25 }))}
          className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white shadow-sm"
        >
          Zoom Out
        </button>
        <button
          onClick={() => setViewBox({ x: -100, y: -100, width: 1400, height: 1000 })}
          className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white shadow-sm"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default MentalMapCanvas