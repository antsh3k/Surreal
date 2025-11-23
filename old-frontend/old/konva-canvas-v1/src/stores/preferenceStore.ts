import { create } from 'zustand'
import type { PreferenceLearningState } from '../types'

interface PreferenceState extends PreferenceLearningState {
  // Actions
  recordClick: (nodeId: string, concept: string) => void
  updatePreferenceScore: (nodeId: string, score: number) => void
  getPreferenceScore: (concept: string) => number
  getTopicPreference: (topic: string) => number
  reset: () => void
  
  // Analytics
  getClickCount: () => number
  getPreferencePattern: () => string[]
  hasLearnedPreferences: () => boolean
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  // Initial state
  clickHistory: [],
  conceptPreferences: {},
  topicPreferences: {},
  learningEnabled: true,
  
  recordClick: (nodeId, concept) => {
    if (!get().learningEnabled) return
    
    set(state => {
      const newClickHistory = [...state.clickHistory, nodeId]
      const conceptKey = concept.toLowerCase()
      
      // Update concept preference based on interaction patterns
      const currentScore = state.conceptPreferences[conceptKey] || 0
      const newScore = Math.min(1, currentScore + 0.1) // Gradually increase preference
      
      // Extract topics from concept for topic-level learning
      const topics = extractTopics(concept)
      const updatedTopicPreferences = { ...state.topicPreferences }
      
      topics.forEach(topic => {
        const topicKey = topic.toLowerCase()
        updatedTopicPreferences[topicKey] = Math.min(1, 
          (updatedTopicPreferences[topicKey] || 0) + 0.05
        )
      })
      
      return {
        clickHistory: newClickHistory,
        conceptPreferences: {
          ...state.conceptPreferences,
          [conceptKey]: newScore
        },
        topicPreferences: updatedTopicPreferences
      }
    })
  },
  
  updatePreferenceScore: (nodeId, score) => {
    // This could be used for explicit feedback or AI-driven preference updates
    set(state => ({
      conceptPreferences: {
        ...state.conceptPreferences,
        [nodeId]: score
      }
    }))
  },
  
  getPreferenceScore: (concept) => {
    const state = get()
    
    // Only show preference colors after meaningful interactions (4+ clicks)
    if (state.clickHistory.length < 4) {
      return 0 // Stay neutral until user has clicked enough
    }
    
    const conceptKey = concept.toLowerCase()
    
    // Base score from direct concept interactions
    const conceptScore = state.conceptPreferences[conceptKey] || 0
    
    // Boost from related topic preferences
    const topics = extractTopics(concept)
    const topicBoost = topics.reduce((boost, topic) => {
      return boost + (state.topicPreferences[topic.toLowerCase()] || 0)
    }, 0) / Math.max(topics.length, 1)
    
    // Combined score with topic influence
    const combinedScore = conceptScore + (topicBoost * 0.3)
    
    // More conservative scoring - only show hints when confident
    if (combinedScore > 0.8) return 0.6  // Strong positive (green)
    if (combinedScore > 0.5) return 0.3  // Mild positive  
    if (combinedScore < 0.2) return -0.3 // Uncertain relevance (orange)
    return 0 // Stay neutral
  },
  
  getTopicPreference: (topic) => {
    const state = get()
    return state.topicPreferences[topic.toLowerCase()] || 0
  },
  
  getClickCount: () => get().clickHistory.length,
  
  getPreferencePattern: () => {
    const state = get()
    return Object.keys(state.conceptPreferences)
      .filter(key => state.conceptPreferences[key] > 0.3)
      .sort((a, b) => state.conceptPreferences[b] - state.conceptPreferences[a])
      .slice(0, 5) // Top 5 preferred concepts
  },
  
  hasLearnedPreferences: () => {
    const state = get()
    return state.clickHistory.length >= 3 && 
           Object.keys(state.conceptPreferences).length > 0
  },
  
  reset: () => set({
    clickHistory: [],
    conceptPreferences: {},
    topicPreferences: {},
    learningEnabled: true
  })
}))

// Helper function to extract topics from concept text
function extractTopics(concept: string): string[] {
  // Simple topic extraction - could be enhanced with NLP
  const words = concept.toLowerCase()
    .split(/[\s,.-]+/)
    .filter(word => word.length > 3)
    .filter(word => !['and', 'the', 'for', 'with', 'from'].includes(word))
  
  // Remove duplicates and return
  return [...new Set(words)]
}