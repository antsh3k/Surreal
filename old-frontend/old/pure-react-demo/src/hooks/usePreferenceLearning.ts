import { useMemo } from 'react'
import { ConceptNode } from '../types'
import { useMentalMapStore } from '../stores/mentalMapStore'

export const usePreferenceLearning = () => {
  const { state } = useMentalMapStore()

  // Analyze user click patterns to predict preferences for new concepts
  const analyzePreferences = useMemo(() => {
    const { clickHistory, preferenceWeights } = state.userPreferences
    
    // If less than 3 interactions, return neutral predictions
    if (clickHistory.length < 3) {
      return {
        hasLearned: false,
        confidence: 0,
        patterns: []
      }
    }

    // Analyze patterns in clicked concepts
    const clickedNodes = clickHistory.map(id => 
      state.nodes.find(n => n.id === id)
    ).filter(Boolean) as ConceptNode[]

    // Simple pattern detection based on concept labels
    const patterns = extractConceptPatterns(clickedNodes)
    
    return {
      hasLearned: true,
      confidence: Math.min(clickHistory.length / 10, 1), // 0-1 scale
      patterns
    }
  }, [state.userPreferences, state.nodes])

  // Predict user interest in a new concept
  const predictInterest = (concept: ConceptNode): number => {
    const { hasLearned, patterns, confidence } = analyzePreferences
    
    if (!hasLearned) return 0 // Neutral
    
    let score = 0
    const conceptWords = concept.label.toLowerCase().split(' ')
    
    // Check against learned patterns
    patterns.forEach(pattern => {
      const overlap = conceptWords.filter(word => 
        pattern.keywords.some(keyword => 
          word.includes(keyword) || keyword.includes(word)
        )
      ).length
      
      if (overlap > 0) {
        score += pattern.strength * (overlap / conceptWords.length)
      }
    })
    
    // Apply confidence weighting
    return Math.max(-1, Math.min(1, score * confidence))
  }

  // Update preference learning when new concepts are generated
  const applyPreferencesToNewNodes = (newNodes: ConceptNode[]): ConceptNode[] => {
    if (!analyzePreferences.hasLearned) {
      return newNodes // Return nodes unchanged if no learning yet
    }
    
    return newNodes.map(node => ({
      ...node,
      preferenceScore: predictInterest(node)
    }))
  }

  // Get smart suggestions based on current preferences
  const getSmartSuggestions = (): string[] => {
    const { patterns, hasLearned } = analyzePreferences
    
    if (!hasLearned || patterns.length === 0) {
      return []
    }
    
    // Generate suggestions based on strongest patterns
    const suggestions = patterns
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map(pattern => `You might enjoy exploring concepts related to: ${pattern.keywords.join(', ')}`)
    
    return suggestions
  }

  return {
    analyzePreferences,
    predictInterest,
    applyPreferencesToNewNodes,
    getSmartSuggestions
  }
}

// Helper function to extract patterns from clicked concepts
function extractConceptPatterns(clickedNodes: ConceptNode[]) {
  const patterns: Array<{
    keywords: string[]
    strength: number
    frequency: number
  }> = []

  // Extract keywords from concept labels
  const allKeywords = clickedNodes.flatMap(node => 
    node.label.toLowerCase()
      .split(/[\s\-_]+/)
      .filter(word => word.length > 2) // Ignore short words
  )

  // Count keyword frequency
  const keywordCounts = allKeywords.reduce((acc, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Create patterns from frequent keywords
  Object.entries(keywordCounts).forEach(([keyword, frequency]) => {
    if (frequency >= 2) { // Keyword appears in at least 2 clicked concepts
      patterns.push({
        keywords: [keyword],
        strength: frequency / clickedNodes.length,
        frequency
      })
    }
  })

  // Detect multi-word patterns (simple bigrams)
  for (let i = 0; i < allKeywords.length - 1; i++) {
    const bigram = `${allKeywords[i]} ${allKeywords[i + 1]}`
    const bigramCount = allKeywords.slice(0, -1).filter((_, index) => 
      `${allKeywords[index]} ${allKeywords[index + 1]}` === bigram
    ).length

    if (bigramCount >= 2) {
      patterns.push({
        keywords: [allKeywords[i], allKeywords[i + 1]],
        strength: bigramCount / (clickedNodes.length - 1),
        frequency: bigramCount
      })
    }
  }

  return patterns.sort((a, b) => b.strength - a.strength)
}