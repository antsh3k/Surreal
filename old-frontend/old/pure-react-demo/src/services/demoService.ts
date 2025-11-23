import { ConceptNode, Connection, DemoScenario } from '../types'

// Demo scenario: Active Inference in AI
export const activeInferenceDemo: DemoScenario = {
  id: 'active-inference',
  name: 'Active Inference in AI',
  topic: 'Active Inference in AI',
  initialNodes: [
    {
      id: 'root',
      label: 'Active Inference in AI',
      description: 'A unified framework for perception, action, and learning',
      isUncertain: false,
      isLoading: false,
      preferenceScore: 0,
      clickCount: 0,
      createdAt: new Date()
    },
    {
      id: 'free-energy',
      label: 'Free Energy Principle',
      description: 'Theoretical foundation of active inference',
      parentId: 'root',
      isUncertain: true,
      isLoading: false,
      preferenceScore: 0,
      clickCount: 0,
      createdAt: new Date()
    },
    {
      id: 'bayesian-brain',
      label: 'Bayesian Brain Theory',
      description: 'Brain as a prediction machine',
      parentId: 'root',
      isUncertain: true,
      isLoading: false,
      preferenceScore: 0,
      clickCount: 0,
      createdAt: new Date()
    },
    {
      id: 'predictive-processing',
      label: 'Predictive Processing',
      description: 'How the brain predicts sensory input',
      parentId: 'root',
      isUncertain: true,
      isLoading: false,
      preferenceScore: 0,
      clickCount: 0,
      createdAt: new Date()
    },
    {
      id: 'robotics-applications',
      label: 'Applications in Robotics',
      description: 'Real-world implementations',
      parentId: 'root',
      isUncertain: true,
      isLoading: false,
      preferenceScore: 0,
      clickCount: 0,
      createdAt: new Date()
    }
  ],
  expansionData: {
    'free-energy': [
      {
        id: 'mathematical-formulation',
        label: 'Mathematical Formulation',
        description: 'Variational free energy equations',
        parentId: 'free-energy',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'biological-evidence',
        label: 'Biological Evidence',
        description: 'Neuroscientific support for the theory',
        parentId: 'free-energy',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0.2, // Slight positive hint
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'historical-development',
        label: 'Historical Development',
        description: 'Evolution of the theory',
        parentId: 'free-energy',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      }
    ],
    'biological-evidence': [
      {
        id: 'fmri-studies',
        label: 'fMRI Studies',
        description: 'Brain imaging evidence',
        parentId: 'biological-evidence',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0.5, // Strong positive hint after pattern detection
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'computational-models',
        label: 'Computational Models',
        description: 'Neural network implementations',
        parentId: 'biological-evidence',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0.3,
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'clinical-applications',
        label: 'Clinical Applications',
        description: 'Medical uses and treatments',
        parentId: 'biological-evidence',
        isUncertain: true,
        isLoading: false,
        preferenceScore: -0.2, // Uncertain relevance
        clickCount: 0,
        createdAt: new Date()
      }
    ],
    'bayesian-brain': [
      {
        id: 'prediction-error',
        label: 'Prediction Error',
        description: 'How the brain learns from mistakes',
        parentId: 'bayesian-brain',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'hierarchical-processing',
        label: 'Hierarchical Processing',
        description: 'Multi-level brain architecture',
        parentId: 'bayesian-brain',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'attention-mechanisms',
        label: 'Attention Mechanisms',
        description: 'How attention modulates prediction',
        parentId: 'bayesian-brain',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      }
    ],
    'predictive-processing': [
      {
        id: 'perception-models',
        label: 'Perception Models',
        description: 'How we see and interpret the world',
        parentId: 'predictive-processing',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'sensory-integration',
        label: 'Sensory Integration',
        description: 'Combining multiple sensory inputs',
        parentId: 'predictive-processing',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'motor-control',
        label: 'Motor Control',
        description: 'Movement prediction and execution',
        parentId: 'predictive-processing',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      }
    ],
    'robotics-applications': [
      {
        id: 'autonomous-navigation',
        label: 'Autonomous Navigation',
        description: 'Robots that predict and plan paths',
        parentId: 'robotics-applications',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'human-robot-interaction',
        label: 'Human-Robot Interaction',
        description: 'Predicting human behavior',
        parentId: 'robotics-applications',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      },
      {
        id: 'manipulation-tasks',
        label: 'Manipulation Tasks',
        description: 'Grasping and object handling',
        parentId: 'robotics-applications',
        isUncertain: true,
        isLoading: false,
        preferenceScore: 0,
        clickCount: 0,
        createdAt: new Date()
      }
    ]
  }
}

// Generate initial connections based on the demo data
export const generateDemoConnections = (nodes: ConceptNode[]): Connection[] => {
  const connections: Connection[] = []
  
  nodes.forEach(node => {
    if (node.parentId) {
      connections.push({
        id: `${node.parentId}-${node.id}`,
        from: node.parentId,
        to: node.id,
        strength: 0.8,
        type: 'parent-child'
      })
    }
  })
  
  return connections
}

// Simulate concept generation with realistic delay
export const generateConceptsForNode = async (nodeId: string): Promise<{
  nodes: ConceptNode[],
  connections: Connection[]
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const expansionData = activeInferenceDemo.expansionData[nodeId]
  if (!expansionData) {
    return { nodes: [], connections: [] }
  }
  
  const newConnections = generateDemoConnections(expansionData)
  
  return {
    nodes: expansionData,
    connections: newConnections
  }
}

// Initialize demo with initial concepts
export const initializeDemo = (): {
  nodes: ConceptNode[],
  connections: Connection[]
} => {
  const { initialNodes } = activeInferenceDemo
  const connections = generateDemoConnections(initialNodes)
  
  return {
    nodes: initialNodes,
    connections
  }
}

// Handle context menu actions (mock implementations)
export const handleContextAction = async (action: string, nodeId: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  switch (action) {
    case 'generate-diagram':
      return `Generated diagram for: ${nodeId}`
    case 'create-summary':
      return `Created summary for: ${nodeId}`
    case 'find-video':
      return `Found educational videos related to: ${nodeId}`
    case 'expand-related':
      return `Found related concepts for: ${nodeId}`
    case 'export-node':
      return `Exported concept: ${nodeId}`
    default:
      return `Action ${action} completed for: ${nodeId}`
  }
}