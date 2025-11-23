// Mock AI concept generation - replace with actual AI integration
export async function generateInitialConcepts(centerConcept: string): Promise<string[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Mock concept generation based on common patterns
  const conceptTemplates = [
    `${centerConcept} Fundamentals`,
    `History of ${centerConcept}`,
    `${centerConcept} Applications`,
    `${centerConcept} Theory`,
    `Modern ${centerConcept}`
  ]
  
  return conceptTemplates
}

export async function generateChildConcepts(parentConcept: string): Promise<string[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Extract key terms and generate sub-concepts
  const subConceptTemplates = [
    `${parentConcept} - Core Principles`,
    `${parentConcept} - Examples`, 
    `${parentConcept} - Use Cases`
  ]
  
  return subConceptTemplates
}

export async function generateConceptDetails(concept: string): Promise<{
  summary: string
  keywords: string[]
  sources: string[]
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  return {
    summary: `${concept} is an important topic that encompasses various aspects and applications. This concept has significant relevance in its field and connects to multiple related areas of study.`,
    keywords: ['fundamental', 'important', 'relevant', 'applicable'],
    sources: [
      'Academic Research Paper 1',
      'Textbook Chapter 3',
      'Online Documentation'
    ]
  }
}

