import { useEffect, useState } from 'react'
import { ShinyText } from '../ui/ShinyText'

interface LoadingNodeProps {
  position: { x: number; y: number }
  label?: string
  duration?: number // Animation duration in ms
}

export const LoadingNode = ({ 
  position, 
  label = "Generating...", 
  duration = 1200 
}: LoadingNodeProps) => {
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4)
    }, duration / 4)

    return () => clearInterval(interval)
  }, [duration])

  return (
    <div 
      className="absolute z-[15]"
      style={{ 
        left: position.x - 120,
        top: position.y - 25,
        transform: 'translate(0, 0)'
      }}
    >
      <div className="relative">
        {/* Clean White Box - No Ripples, but Blue Border */}
        <div className="relative z-10 px-6 py-3 rounded-xl bg-white border-2 border-blue-400 shadow-md min-w-[240px]">
          
          {/* Clean Minimalist Content */}
          <div className="relative z-10 text-center">
            <div className="mb-1">
              <ShinyText text={label} className="text-sm font-medium text-blue-600" />
            </div>
            
            {/* Simple Blue Dots Animation */}
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((dot) => (
                <div
                  key={dot}
                  className={`
                    w-1 h-1 bg-blue-500 rounded-full transition-opacity duration-300
                    ${animationPhase === dot ? 'opacity-100' : 'opacity-30'}
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
