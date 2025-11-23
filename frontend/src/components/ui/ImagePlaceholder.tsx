interface ImagePlaceholderProps {
  width?: number
  height?: number
  className?: string
  text?: string
}

export const ImagePlaceholder = ({ 
  width = 180, 
  height = 120, 
  className = '',
  text = 'Generating...'
}: ImagePlaceholderProps) => {
  return (
    <div 
      className={`
        bg-gray-50 rounded-lg 
        flex items-center justify-center animate-pulse
        ${className}
      `}
      style={{ width, height }}
    >
      <span className="text-sm text-gray-500">
        {text}
      </span>
    </div>
  )
}