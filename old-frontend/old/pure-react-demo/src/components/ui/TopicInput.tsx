import { useState } from 'react'
import { motion } from 'framer-motion'

interface TopicInputProps {
  onSubmit: (topic: string) => void
  isLoading: boolean
  placeholder?: string
}

const TopicInput = ({ 
  onSubmit, 
  isLoading, 
  placeholder = "Active Inference in AI" 
}: TopicInputProps) => {
  const [topic, setTopic] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim() && !isLoading) {
      onSubmit(topic.trim())
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.form
        onSubmit={handleSubmit}
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg 
                     focus:border-gray-900 focus:ring-1 focus:ring-gray-900 
                     outline-none transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed
                     bg-white"
          />
          
          <motion.button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white 
                     rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-blue-700 active:scale-95 transition-all duration-150
                     focus:ring-2 focus:ring-blue-100 focus:outline-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Creating...</span>
              </div>
            ) : (
              'Explore'
            )}
          </motion.button>
        </div>
        
        <div className="mt-3 text-sm text-gray-500 text-center">
          Start with any topic and click dashed concepts to explore deeper
        </div>
      </motion.form>
    </div>
  )
}

export default TopicInput