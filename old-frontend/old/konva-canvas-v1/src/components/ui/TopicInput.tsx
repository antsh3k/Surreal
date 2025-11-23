import { useState } from 'react'
import { useCanvasStore } from '../../stores/canvasStore'
import { usePreferenceStore } from '../../stores/preferenceStore'
import type { ConceptNodeData } from '../../types'

interface TopicInputProps {
  onTopicSubmit?: (topic: string) => void
}

export const TopicInput = ({ onTopicSubmit }: TopicInputProps) => {
  const [topic, setTopic] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { setNodes, setCurrentTopic, setLoading, setViewport } = useCanvasStore()
  const { reset: resetPreferences } = usePreferenceStore()

  const generateInitialConcepts = async (inputTopic: string): Promise<ConceptNodeData[]> => {
    // Create CENTRAL TOPIC NODE that everything grows from
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    // Central topic node (larger, prominent)
    const centralNode: ConceptNodeData = {
      id: 'central-topic',
      label: inputTopic,
      concept: inputTopic,
      isUncertain: false, // Central topic is never uncertain
      preferenceScore: 0,
      position: { x: centerX - 140, y: centerY - 50 }, // Center the node
      size: { width: 280, height: 100 },
      level: 0,
      isExpanded: false
    }

    // Child concepts arranged around the central node in radial pattern
    const radius = 200
    const angleStep = (2 * Math.PI) / 5 // 5 concepts around center
    
    const childConcepts: ConceptNodeData[] = [
      'Core Principles',
      'Historical Context', 
      'Applications',
      'Key Challenges',
      'Future Directions'
    ].map((label, index) => {
      const angle = index * angleStep - Math.PI / 2 // Start from top
      const x = centerX + Math.cos(angle) * radius - 120 // 120 = half node width
      const y = centerY + Math.sin(angle) * radius - 40  // 40 = half node height
      
      return {
        id: `concept-${index + 1}`,
        label,
        concept: `${label} of ${inputTopic}`,
        isUncertain: true,
        preferenceScore: 0,
        position: { x, y },
        size: { width: 240, height: 80 },
        parentId: 'central-topic',
        level: 1
      }
    })

    // Domain-specific concept customization
    if (inputTopic.toLowerCase().includes('ai') || inputTopic.toLowerCase().includes('artificial')) {
      childConcepts[0].label = 'Machine Learning'
      childConcepts[1].label = 'Neural Networks'
      childConcepts[2].label = 'Ethics & Safety'
      childConcepts[3].label = 'Industry Applications'
      childConcepts[4].label = 'AGI Research'
    } else if (inputTopic.toLowerCase().includes('music')) {
      childConcepts[0].label = 'Musical Theory'
      childConcepts[1].label = 'Cultural Origins'
      childConcepts[2].label = 'Performance Styles'
      childConcepts[3].label = 'Notable Artists'
      childConcepts[4].label = 'Modern Evolution'
    } else if (inputTopic.toLowerCase().includes('code') || inputTopic.toLowerCase().includes('programming')) {
      childConcepts[0].label = 'Core Architecture'
      childConcepts[1].label = 'Dependencies'
      childConcepts[2].label = 'Key Features'
      childConcepts[3].label = 'Development Workflow'
      childConcepts[4].label = 'Testing Strategy'
    }

    return [centralNode, ...childConcepts]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true, 'Analyzing topic...')
    setIsSubmitted(true)
    
    try {
      // Reset previous state
      resetPreferences()
      
      // Generate initial concepts
      const concepts = await generateInitialConcepts(topic.trim())
      
      // Simulate API delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create connections from central topic to child concepts
      const connections: any[] = concepts.slice(1).map((childNode) => ({
        id: `central-${childNode.id}`,
        fromNodeId: 'central-topic',
        toNodeId: childNode.id,
        type: 'parent-child' as const
      }))
      
      // Set the concepts, connections, and topic
      setNodes(concepts)
      useCanvasStore.getState().setConnections(connections)
      setCurrentTopic(topic.trim())
      
      // Center viewport on the central topic (no offset needed as nodes are already centered)
      setViewport({ x: 0, y: 0, scale: 1 })
      
      // Notify parent component
      onTopicSubmit?.(topic.trim())
      
    } catch (error) {
      console.error('Failed to generate concepts:', error)
      setIsSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  const handleNewTopic = () => {
    setIsSubmitted(false)
    setTopic('')
    setNodes([])
    setCurrentTopic('')
    resetPreferences()
    setViewport({ x: 0, y: 0, scale: 1 })
  }

  if (isSubmitted) {
    return (
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white rounded-lg shadow-lg px-6 py-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {useCanvasStore.getState().currentTopic}
            </h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <button
            onClick={handleNewTopic}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            New Topic
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Clean Minimal Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-light text-gray-900 mb-6 tracking-tight">
            🧠 <span className="font-medium">Surreal</span> Mental Maps
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Minimalist Discovery Engine for Context-Rich Exploration
          </p>
        </div>

        {/* Clean Input Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-2xl mx-auto">
          {/* Simple Header */}
          <div className="p-8 pb-6">
            <h2 className="text-2xl font-medium text-gray-900 mb-3 text-center">
              What would you like to explore?
            </h2>
          </div>

          {/* Minimal Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Active Inference in AI"
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none font-medium placeholder-gray-400"
                  autoFocus
                />
              </div>

              {/* Subtle Examples */}
              <div className="grid grid-cols-3 gap-2">
                {["Active Inference in AI", "History of Jazz Music", "Next.js Authentication"].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setTopic(example)}
                    className="px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150 text-center border border-gray-100"
                  >
                    {example}
                  </button>
                ))}
              </div>
              
              <button
                type="submit"
                disabled={!topic.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-medium text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                Start Exploring →
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}