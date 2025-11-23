import type { ConceptNodeData } from '../types'

// Mock data service for development and demo purposes
export class MockDataService {
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async generateInitialConcepts(topic: string): Promise<ConceptNodeData[]> {
    await this.delay(1500) // Simulate API call

    const topicMappings: Record<string, ConceptNodeData[]> = {
      'active inference': [
        {
          id: 'ai-root',
          label: topic,
          isUncertain: false,
          preferenceScore: 0,
          children: ['ai-fep', 'ai-brain', 'ai-predict', 'ai-robotics'],
        },
        {
          id: 'ai-fep',
          label: 'Free Energy Principle',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'ai-root',
        },
        {
          id: 'ai-brain',
          label: 'Bayesian Brain Theory',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'ai-root',
        },
        {
          id: 'ai-predict',
          label: 'Predictive Processing',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'ai-root',
        },
        {
          id: 'ai-robotics',
          label: 'Applications in Robotics',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'ai-root',
        },
      ],
      'jazz music': [
        {
          id: 'jazz-root',
          label: topic,
          isUncertain: false,
          preferenceScore: 0,
          children: ['jazz-origins', 'jazz-swing', 'jazz-bebop', 'jazz-modern'],
        },
        {
          id: 'jazz-origins',
          label: 'Origins (1890s-1910s)',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'jazz-root',
        },
        {
          id: 'jazz-swing',
          label: 'Swing Era (1930s-1940s)',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'jazz-root',
        },
        {
          id: 'jazz-bebop',
          label: 'Bebop Revolution (1940s-1950s)',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'jazz-root',
        },
        {
          id: 'jazz-modern',
          label: 'Modern Jazz (1960s+)',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'jazz-root',
        },
      ],
      'next.js authentication': [
        {
          id: 'nextauth-root',
          label: topic,
          isUncertain: false,
          preferenceScore: 0,
          children: ['nextauth-jwt', 'nextauth-login', 'nextauth-routes', 'nextauth-session'],
        },
        {
          id: 'nextauth-jwt',
          label: 'JWT Token Flow',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'nextauth-root',
        },
        {
          id: 'nextauth-login',
          label: 'Login Component',
          isUncertain: false,
          preferenceScore: 0,
          children: [],
          parentId: 'nextauth-root',
        },
        {
          id: 'nextauth-routes',
          label: 'Protected Routes',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'nextauth-root',
        },
        {
          id: 'nextauth-session',
          label: 'Session Management',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: 'nextauth-root',
        },
      ],
    }

    // Normalize topic for lookup
    const normalizedTopic = topic.toLowerCase()
    
    // Find best match
    const matchingKey = Object.keys(topicMappings).find(key => 
      normalizedTopic.includes(key) || key.includes(normalizedTopic)
    )
    
    if (matchingKey) {
      return topicMappings[matchingKey]
    }
    
    // Generic fallback
    return [
      {
        id: 'generic-root',
        label: topic,
        isUncertain: false,
        preferenceScore: 0,
        children: ['generic-1', 'generic-2', 'generic-3', 'generic-4'],
      },
      {
        id: 'generic-1',
        label: 'Core Concepts',
        isUncertain: true,
        preferenceScore: 0,
        children: [],
        parentId: 'generic-root',
      },
      {
        id: 'generic-2',
        label: 'Key Applications',
        isUncertain: true,
        preferenceScore: 0,
        children: [],
        parentId: 'generic-root',
      },
      {
        id: 'generic-3',
        label: 'Historical Context',
        isUncertain: true,
        preferenceScore: 0,
        children: [],
        parentId: 'generic-root',
      },
      {
        id: 'generic-4',
        label: 'Future Directions',
        isUncertain: true,
        preferenceScore: 0,
        children: [],
        parentId: 'generic-root',
      },
    ]
  }

  async expandConcept(nodeId: string, _parentTopic: string): Promise<ConceptNodeData[]> {
    await this.delay(2000) // Simulate thinking time

    const expansions: Record<string, ConceptNodeData[]> = {
      'ai-fep': [
        {
          id: 'fep-math',
          label: 'Mathematical Formulation',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: nodeId,
        },
        {
          id: 'fep-bio',
          label: 'Biological Evidence',
          isUncertain: true,
          preferenceScore: 0.1, // Slight preference hint
          children: [],
          parentId: nodeId,
        },
        {
          id: 'fep-history',
          label: 'Historical Development',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: nodeId,
        },
      ],
      'ai-brain': [
        {
          id: 'brain-models',
          label: 'Computational Models',
          isUncertain: true,
          preferenceScore: 0.2,
          children: [],
          parentId: nodeId,
        },
        {
          id: 'brain-neuro',
          label: 'Neuroscience Evidence',
          isUncertain: true,
          preferenceScore: 0.3, // Higher preference
          children: [],
          parentId: nodeId,
        },
        {
          id: 'brain-algorithms',
          label: 'Learning Algorithms',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: nodeId,
        },
      ],
      'jazz-origins': [
        {
          id: 'origins-nola',
          label: 'New Orleans Roots',
          isUncertain: true,
          preferenceScore: 0.2,
          children: [],
          parentId: nodeId,
        },
        {
          id: 'origins-african',
          label: 'African Influences',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: nodeId,
        },
        {
          id: 'origins-recordings',
          label: 'Early Recordings',
          isUncertain: true,
          preferenceScore: 0,
          children: [],
          parentId: nodeId,
        },
      ],
    }

    return expansions[nodeId] || []
  }
}

export const mockDataService = new MockDataService()