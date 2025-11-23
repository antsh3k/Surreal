import { useState, useRef, useEffect } from 'react'
import DotGrid from '../ui/DotGrid'

interface InitialPromptProps {
  onSubmit: (concept: string) => Promise<void>
}

const useTypingPlaceholder = (texts: string[], typingSpeed = 80, deletingSpeed = 40, pauseDuration = 2000) => {
  const [placeholder, setPlaceholder] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = texts[textIndex]
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (placeholder.length < currentText.length) {
          setPlaceholder(currentText.slice(0, placeholder.length + 1))
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => setIsDeleting(true), pauseDuration)
        }
      } else {
        // Deleting
        if (placeholder.length > 0) {
          setPlaceholder(currentText.slice(0, placeholder.length - 1))
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false)
          setTextIndex((textIndex + 1) % texts.length)
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed)

    return () => clearTimeout(timeout)
  }, [placeholder, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pauseDuration])

  return placeholder
}

export const InitialPrompt = ({ onSubmit }: InitialPromptProps) => {
  const [concept, setConcept] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const placeholderText = useTypingPlaceholder([
    'Active Inference AI',
    'World Model RL'
  ])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedConcept = concept.trim()
    
    if (!trimmedConcept) return

    setIsLoading(true)
    
    try {
      await onSubmit(trimmedConcept)
    } catch (error) {
      console.error('Failed to submit concept:', error)
      setIsLoading(false)
    }
  }

  // Clean blue accent for minimal premium aesthetic
  const accentBlue = '#3b82f6' // blue-500 - clean, modern blue

  return (
    <div className="min-h-screen bg-white px-4 selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      {/* Animated Dot Grid Background - Whisper Subtle */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={5}
          gap={38}
          baseColor="#d1d5db"
          activeColor="#60a5fa"
          proximity={100}
          speedTrigger={400}
          shockRadius={120}
          shockStrength={1.5}
          maxSpeed={1500}
          resistance={950}
          returnDuration={3}
        />
      </div>

      {/* Grid Layout: Top section (logo/title) | Middle section (input - centered) | Bottom spacer */}
      <div className="min-h-screen grid grid-rows-[auto_1fr_1fr] items-center justify-items-center relative z-10">
        
        {/* Logo and Title - Upper Section */}
        <div className="flex flex-col items-center pt-20 md:pt-24">
          <div className="mb-8 select-none">
            <img 
              src="/logo_surreal.png" 
              alt="Surreal" 
              className="w-48 h-48 md:w-56 md:h-56 object-contain opacity-90"
            />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-gray-900 select-none">
            Surreal
          </h1>
        </div>

        {/* Input Form - Perfectly Centered */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl relative flex items-center justify-center">
          {/* 
            Commented out StarBorder for cleaner, minimal aesthetic.
            Keeping the import and code in case we want to revert or use elsewhere.
          
          <StarBorder
            as="div"
            className="w-full"
            color={accentBlue}
            speed="8s"
            thickness={1} // Thin minimal border
          > 
          */}
            <div 
              className={`
                relative w-full flex items-center bg-white 
                rounded-2xl border-2 transition-all duration-300 ease-out
                ${isFocused 
                  ? 'border-blue-500 shadow-[0_8px_30px_rgba(59,130,246,0.12)] transform -translate-y-0.5' 
                  : 'border-blue-400 shadow-[0_4px_16px_rgba(59,130,246,0.08)] hover:border-blue-500'
                }
              `}
            >
              <input
                ref={inputRef}
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading}
                className="w-full py-5 pl-8 pr-16 text-2xl font-light text-gray-900 bg-transparent border-none outline-none placeholder-transparent z-10"
                spellCheck={false}
                maxLength={100}
              />
              
              {/* Placeholder Overlay - Hides completely when focused */}
              {!concept && !isFocused && (
                <div className="absolute inset-0 flex items-center pl-8 pointer-events-none z-0">
                  <span className="text-2xl font-light text-gray-400 whitespace-nowrap">
                    {placeholderText}
                    <span 
                      className="inline-block w-[2px] h-6 ml-1 align-middle animate-pulse"
                      style={{ backgroundColor: accentBlue }}
                    />
                  </span>
                </div>
              )}

              {/* Send Button - Minimalist Arrow */}
              <button
                type="submit"
                disabled={!concept.trim() || isLoading}
                className={`
                  absolute right-4 p-2 rounded-full transition-all duration-200 z-20
                  ${concept.trim() && !isLoading 
                    ? 'text-gray-700 hover:bg-gray-100 cursor-pointer opacity-100' 
                    : 'text-gray-300 cursor-not-allowed opacity-50'}
                `}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                ) : (
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="transform transition-transform duration-200 active:scale-95"
                  >
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          {/* </StarBorder> */}
        </form>

        {/* Bottom Spacer - Balances the layout */}
        <div></div>
      </div>
    </div>
  )
}
