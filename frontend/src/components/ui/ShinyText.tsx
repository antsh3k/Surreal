import './ShinyText.css'

interface ShinyTextProps {
  text: string
  className?: string
}

export const ShinyText = ({ text, className = '' }: ShinyTextProps) => {
  return (
    <span className={`shiny-text ${className}`}>
      {text}
    </span>
  )
}

