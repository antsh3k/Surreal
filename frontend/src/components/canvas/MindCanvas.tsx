import { Tldraw, toRichText, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import './MindCanvas.css'

interface MindCanvasProps {
  children?: React.ReactNode
}

export const MindCanvas = ({ children }: MindCanvasProps) => {
  const handleMount = (editor: Editor) => {
    try {
      // Create a simple rectangle shape to verify canvas is working
      editor.createShape({
        type: 'geo',
        x: 300,
        y: 200,
        props: {
          w: 200,
          h: 100,
          geo: 'rectangle',
          fill: 'solid',
          color: 'blue',
          dash: 'draw',
          size: 'm',
        },
      })
      
      // Also create a text shape
      editor.createShape({
        type: 'text',
        x: 350,
        y: 230,
        props: {
          richText: toRichText('tldraw is working! 🎨'),
          color: 'blue',
        },
      })
      
      console.log('✅ tldraw canvas mounted and test shapes created')
    } catch (error) {
      console.warn('Could not create test shapes:', error)
      // Canvas is still working even if shape creation fails
      console.log('✅ tldraw canvas mounted (shape creation skipped)')
    }
  }

  return (
    <div className="mindcanvas-container" style={{ position: 'fixed', inset: 0 }}>
      <Tldraw 
        autoFocus={false}
        onMount={handleMount}
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

