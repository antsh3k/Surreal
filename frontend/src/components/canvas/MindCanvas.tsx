import { useRef } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import './MindCanvas.css'
import { ConceptShapeUtil } from '../../shapes/ConceptShapeUtil'

interface MindCanvasProps {
  children?: React.ReactNode
}

export const MindCanvas = ({ children }: MindCanvasProps) => {
  const shapeCreatedRef = useRef(false)

  const handleMount = (editor: Editor) => {
    // Prevent duplicate creation from React StrictMode double-mounting
    if (shapeCreatedRef.current) {
      console.log('⚠️ Shape already created, skipping duplicate creation')
      return
    }

    try {
      // Clear any existing shapes first (in case of persistence)
      const existingShapes = editor.getCurrentPageShapes()
      if (existingShapes.length > 0) {
        console.log(`🧹 Clearing ${existingShapes.length} existing shape(s)`)
        editor.deleteShapes(existingShapes.map(s => s.id))
      }

      // Create a concept shape with React Bits effects to verify canvas is working
      editor.createShape({
        type: 'concept-shape',
        x: 300,
        y: 200,
        props: {
          w: 250,
          h: 120,
          text: 'tldraw is working! 🎨',
          preferenceScore: 0.8, // High preference triggers StarBorder and ShinyText
        },
      })
      
      shapeCreatedRef.current = true
      console.log('✅ tldraw canvas mounted and concept shape created with React Bits effects')
    } catch (error) {
      console.warn('Could not create concept shape:', error)
      // Canvas is still working even if shape creation fails
      console.log('✅ tldraw canvas mounted (shape creation skipped)')
    }
  }

  return (
    <div className="mindcanvas-container" style={{ position: 'fixed', inset: 0 }}>
      <Tldraw 
        autoFocus={false}
        onMount={handleMount}
        shapeUtils={[ConceptShapeUtil]}
        persistenceKey={import.meta.env.DEV ? 'mindcanvas-dev' : 'mindcanvas'}
      />
      
      {/* Custom UI overlay - this is where our nodes will go */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>
      
      {/* Test overlay to verify integration */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg pointer-events-auto z-[60]">
        <h3 className="text-sm font-medium text-green-600">
          ✅ MindCanvas Engine Active
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          tldraw: Ready | React Bits: Testing...
        </p>
      </div>
    </div>
  )
}

