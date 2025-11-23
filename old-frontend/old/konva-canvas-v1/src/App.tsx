import { useState } from 'react'
import { KonvaStage } from './components/canvas/KonvaStage'
import { TopicInput } from './components/ui/TopicInput'
import { ContextMenu } from './components/ui/ContextMenu'
import { StatusIndicator } from './components/ui/StatusIndicator'
import { useCanvasStore } from './stores/canvasStore'
import { ExportEngine } from './services/exportEngine'

function App() {
  const [showTopicInput, setShowTopicInput] = useState(true)
  const { setContextMenu, nodes, connections, currentTopic } = useCanvasStore()

  const handleTopicSubmit = (topic: string) => {
    console.log('Topic submitted:', topic)
    setShowTopicInput(false)
  }

  const handleContextMenuClose = () => {
    setContextMenu(null)
  }

  const handleExport = async () => {
    try {
      const filename = currentTopic.toLowerCase().replace(/\s+/g, '-') || 'mental-map'
      await ExportEngine.downloadJSON(nodes, connections, filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  // CLEAN FIRST PRINCIPLES: Two distinct app states
  if (showTopicInput) {
    // STATE 1: Topic Input Mode - ONLY the beautiful topic input form
    return <TopicInput onTopicSubmit={handleTopicSubmit} />
  }

  // STATE 2: Canvas Mode - ONLY the interactive canvas experience  
  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden">
      {/* Clean Topic Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-medium text-gray-900">
                🧠 <span className="font-light">Surreal</span>
              </h1>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-medium text-gray-700">{currentTopic}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Export
            </button>
            <button
              onClick={() => setShowTopicInput(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              New Topic
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas with top padding for header */}
      <div className="pt-16 h-full">
        <KonvaStage />
      </div>
      
      {/* Context Menu */}
      <ContextMenu onClose={handleContextMenuClose} />
      
      {/* Status Indicators */}
      <StatusIndicator />
    </div>
  )
}

export default App
