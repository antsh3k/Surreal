import './BlurText.css'

interface BlurTextProps {
  text: string
  className?: string
}

export const BlurText = ({ text, className = '' }: BlurTextProps) => {
  return (
    <span className={`blur-text ${className}`}>
      {text}
    </span>
  )
}

