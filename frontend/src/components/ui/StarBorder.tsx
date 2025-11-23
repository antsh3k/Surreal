import './StarBorder.css'
import type { ElementType, ReactNode, CSSProperties } from 'react'

interface StarBorderProps {
  as?: ElementType
  className?: string
  color?: string
  speed?: string
  thickness?: number
  children: ReactNode
  style?: CSSProperties
  [key: string]: any
}

const StarBorder = ({
  as: Component = 'button',
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps) => {
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{
        padding: `${thickness}px`, // Use padding to create the border width
        ...style
      }}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div className="inner-content" style={{ background: 'inherit' }}>{children}</div>
    </Component>
  )
}

export default StarBorder
