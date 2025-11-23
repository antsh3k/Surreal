import { useEffect, useState } from 'react'
import { BlurText } from '../ui/BlurText'

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
      className="absolute z-20"
      style={{ 
        left: position.x - 70,
        top: position.y - 20,
        transform: 'translate(0, 0)'
      }}
    >
      <div className="relative">
        {/* Multiple Ripple Effects with Staggered Animation */}
        <div className="loading-ripple" />
        <div className="loading-ripple-2" />
        <div className="loading-ripple-3" />
        
        {/* Central Loading Content */}
        <div className="relative z-10 px-4 py-2 rounded-lg bg-white border-2 border-blue-400 min-w-[140px]">
          {/* Pulsing Background */}
          <div className="absolute inset-0 bg-blue-50 rounded-lg opacity-50 animate-pulse" />
          
          {/* React Bits Blur Effect */}
          <div className="relative z-10 text-center">
            <BlurText text={label} />
            
            {/* Loading Dots Animation */}
            <div className="flex justify-center space-x-1 mt-1">
              {[0, 1, 2].map((dot) => (
                <div
                  key={dot}
                  className={`
                    w-1.5 h-1.5 bg-blue-500 rounded-full transition-opacity duration-300
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

