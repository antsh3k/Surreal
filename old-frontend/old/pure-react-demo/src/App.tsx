import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MentalMapProvider, useMentalMapStore, useMentalMapActions } from './stores/mentalMapStore'
import { usePreferenceLearning } from './hooks/usePreferenceLearning'
import MentalMapCanvas from './components/mental-map/MentalMapCanvas'
import TopicInput from './components/ui/TopicInput'
import ContextMenu from './components/interactions/ContextMenu'
import { initializeDemo, generateConceptsForNode, handleContextAction } from './services/demoService'
// import { Position } from './types' // Removed unused import

// Main app component wrapped in provider
function App() {
  return (
    <MentalMapProvider>
      <SurrealApp />
    </MentalMapProvider>
  )
}

// Inner app component with access to store
function SurrealApp() {
  const { state } = useMentalMapStore()
  const { setTopic, addNodes, addConnections, expandNode, openContextMenu, closeContextMenu, resetMap } = useMentalMapActions()
  const { applyPreferencesToNewNodes } = usePreferenceLearning()
  const [notification, setNotification] = useState<string>('')

  const handleTopicSubmit = async (topic: string) => {
    setTopic(topic)
    resetMap()
    
    // Initialize with demo data for "Active Inference in AI"
    if (topic.toLowerCase().includes('active inference')) {
      const { nodes, connections } = initializeDemo()
      addNodes(nodes)
      addConnections(connections)
    } else {
      // For other topics, create generic concepts
      const genericNodes = [
        {
          id: `${topic}-root`,
          label: topic,
          isUncertain: false,
          isLoading: false,
          preferenceScore: 0,
          clickCount: 0,
          createdAt: new Date()
        },
        {
          id: `${topic}-concept-1`,
          label: 'Key Concepts',
          parentId: `${topic}-root`,
          isUncertain: true,
          isLoading: false,
          preferenceScore: 0,
          clickCount: 0,
          createdAt: new Date()
        },
        {
          id: `${topic}-applications-2`,
          label: 'Applications',
          parentId: `${topic}-root`,
          isUncertain: true,
          isLoading: false,
          preferenceScore: 0,
          clickCount: 0,
          createdAt: new Date()
        },
        {
          id: `${topic}-history-3`,
          label: 'Historical Context',
          parentId: `${topic}-root`,
          isUncertain: true,
          isLoading: false,
          preferenceScore: 0,
          clickCount: 0,
          createdAt: new Date()
        }
      ]
      addNodes(genericNodes)
    }
  }

  const handleNodeClick = async (nodeId: string) => {
    try {
      const { nodes: newNodes, connections: newConnections } = await generateConceptsForNode(nodeId)
      
      // Apply preference learning to new nodes
      const enhancedNodes = applyPreferencesToNewNodes(newNodes)
      
      expandNode(nodeId, enhancedNodes, newConnections)
      
      // Show notification for preference learning after a few interactions
      if (state.userPreferences.totalInteractions >= 3) {
        setNotification('✨ Learning your preferences...')
        setTimeout(() => setNotification(''), 3000)
      }
    } catch (error) {
      console.error('Failed to expand node:', error)
      setNotification('Failed to expand concept. Please try again.')
      setTimeout(() => setNotification(''), 3000)
    }
  }

  const handleContextMenuAction = async (action: string, nodeId: string) => {
    try {
      const result = await handleContextAction(action, nodeId)
      setNotification(result)
      setTimeout(() => setNotification(''), 3000)
    } catch (error) {
      console.error('Context action failed:', error)
      setNotification('Action failed. Please try again.')
      setTimeout(() => setNotification(''), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header - only show when there's content */}
      {state.nodes.length > 0 && (
        <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">Surreal</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{state.topic}</span>
              </div>
              
              <div className="text-sm text-gray-500">
                {state.userPreferences.totalInteractions} interactions • {state.nodes.length} concepts
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative">
        {state.nodes.length === 0 ? (
          // Minimalist topic input - clean and focused
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="max-w-xl mx-auto px-6 text-center">
              <div className="mb-12">
                <h1 className="text-2xl font-medium text-black mb-3">
                  Mental Maps for Discovery
                </h1>
                <p className="text-gray-600">
                  Enter any topic to begin exploring
                </p>
              </div>
              
              <TopicInput 
                onSubmit={handleTopicSubmit}
                isLoading={state.isGenerating}
              />
            </div>
          </div>
        ) : (
          // Mental map view
          <div className="relative">
            <MentalMapCanvas
              nodes={state.nodes}
              connections={state.connections}
              onNodeClick={handleNodeClick}
              onContextMenu={openContextMenu}
            />
            
            {/* Learning indicator */}
            {state.userPreferences.totalInteractions >= 3 && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-3 max-w-sm">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">🧠</span>
                  <span className="font-medium text-gray-900">Learning your preferences</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Green hints show concepts likely to interest you
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  resetMap()
                  setTopic('')
                }}
                className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white shadow-sm transition-colors"
              >
                New Topic
              </button>
            </div>
          </div>
        )}

        {/* Context Menu */}
        <AnimatePresence>
          {state.contextMenu && (
            <ContextMenu
              nodeId={state.contextMenu.nodeId}
              position={state.contextMenu.position}
              onClose={closeContextMenu}
              onAction={handleContextMenuAction}
            />
          )}
        </AnimatePresence>

        {/* Notifications */}
        <AnimatePresence>
          {notification && (
            <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              {notification}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App