import { motion } from 'framer-motion'
import { Connection, Position } from '../../types'

interface ConnectionLineProps {
  connection: Connection
  fromPosition: Position
  toPosition: Position
}

const ConnectionLine = ({ connection, fromPosition, toPosition }: ConnectionLineProps) => {
  if (!fromPosition || !toPosition) {
    return null
  }

  const getStrokeColor = () => {
    switch (connection.type) {
      case 'parent-child':
        return '#E5E5E5'
      case 'related':
        return '#D1D5DB'
      case 'generated':
        return '#10B981'
      default:
        return '#E5E5E5'
    }
  }

  const getStrokeWidth = () => {
    return 1 + (connection.strength * 2) // 1-3px based on strength
  }

  // Create a slight curve for more natural look
  const midX = (fromPosition.x + toPosition.x) / 2
  const midY = (fromPosition.y + toPosition.y) / 2
  const offsetX = (toPosition.y - fromPosition.y) * 0.1 // Slight curve perpendicular to line
  const offsetY = (fromPosition.x - toPosition.x) * 0.1

  const pathData = `M ${fromPosition.x} ${fromPosition.y} Q ${midX + offsetX} ${midY + offsetY} ${toPosition.x} ${toPosition.y}`

  return (
    <motion.path
      d={pathData}
      stroke={getStrokeColor()}
      strokeWidth={getStrokeWidth()}
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      exit={{ pathLength: 0, opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="pointer-events-none"
    />
  )
}

export default ConnectionLine