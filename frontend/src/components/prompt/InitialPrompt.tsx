import { useState, useRef, useEffect } from 'react'
import StarBorder from '../ui/StarBorder'

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

  // Deep vibrant blue for both border and cursor
  const intenseBlue = '#3b82f6' // blue-500

  // Inverted colors: white background, black text
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 selection:bg-blue-200 selection:text-black">
      <div className="w-full max-w-xl flex flex-col items-center text-center">
        
        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-black mb-20 select-none opacity-90">
          Surreal
        </h1>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full relative flex items-center justify-center">
          <StarBorder
            as="div"
            className="w-full"
            color={intenseBlue}
            speed="4s"
            thickness={1} // Thin minimal border
          >
            <div className="relative w-full flex items-center bg-white rounded-[inherit] border border-gray-100 shadow-sm">
              <input
                ref={inputRef}
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading}
                className="w-full py-5 pl-8 pr-16 text-2xl font-light text-black bg-transparent border-none outline-none placeholder-transparent z-10"
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
                      style={{ backgroundColor: intenseBlue }}
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
                    ? 'text-black hover:bg-gray-100 cursor-pointer opacity-100' 
                    : 'text-gray-300 cursor-not-allowed opacity-50'}
                `}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
          </StarBorder>
        </form>
      </div>
    </div>
  )
}
