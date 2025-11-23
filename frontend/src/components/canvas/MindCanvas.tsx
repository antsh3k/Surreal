import { useRef, useEffect } from 'react'
import { Tldraw, type Editor, useEditor, useValue, type TLEventInfo } from 'tldraw'
import 'tldraw/tldraw.css'
import './MindCanvas.css'
import { ConceptShapeUtil } from '../../shapes/ConceptShapeUtil'

interface MindCanvasProps {
  children?: React.ReactNode
  onBackgroundClick?: () => void
}

// Inner component to handle camera sync and events
const CanvasLayer = ({ children, onBackgroundClick }: MindCanvasProps) => {
  const editor = useEditor()
  
  // Reactive camera position hook
  const camera = useValue('camera', () => editor.getCamera(), [editor])

  useEffect(() => {
    // Handle background clicks to close panels
    const listener = (info: TLEventInfo) => {
      // Check if the click target is the canvas background
      if (info.type === 'canvas' && onBackgroundClick) {
        onBackgroundClick()
      }
    }

    // Bind the event listener
    const cleanup = editor.on('click', listener)
    
    // Check if cleanup is actually a function before calling it
    // This handles differences between tldraw versions
    return () => {
      if (typeof cleanup === 'function') {
        cleanup()
      } else if (typeof cleanup === 'object' && cleanup !== null && 'destroy' in cleanup) {
         // @ts-ignore - handle potential object return with destroy method
        cleanup.destroy()
      } else {
        // If editor.on doesn't return a cleanup function, we might need to manually remove
        // However, most recent tldraw versions return a function. 
        // If it's undefined, we just do nothing.
        editor.off('click', listener)
      }
    }
  }, [editor, onBackgroundClick])

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-50 origin-top-left"
      style={{
        // Sync this div's transform with the tldraw camera
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`
      }}
    >
      {/* Re-enable pointer events for our interactive nodes */}
      <div className="pointer-events-auto">
        {children}
      </div>
    </div>
  )
}

export const MindCanvas = ({ children, onBackgroundClick }: MindCanvasProps) => {
  const shapeCreatedRef = useRef(false)

  const handleMount = (editor: Editor) => {
    if (shapeCreatedRef.current) return
    
    try {
      const existingShapes = editor.getCurrentPageShapes()
      if (existingShapes.length > 0) {
        editor.deleteShapes(existingShapes.map(s => s.id))
      }

      // Create a debug shape to verify tldraw is working
      editor.createShape({
        type: 'concept-shape',
        x: 300, y: 200,
        props: { text: 'tldraw is working! 🎨', preferenceScore: 0.8 },
      })
      
      shapeCreatedRef.current = true
    } catch (error) {
      console.warn('Could not create concept shape:', error)
    }
  }

  return (
    <div className="mindcanvas-container" style={{ position: 'fixed', inset: 0 }}>
      <Tldraw 
        autoFocus={false}
        onMount={handleMount}
        shapeUtils={[ConceptShapeUtil]}
        persistenceKey={import.meta.env.DEV ? 'mindcanvas-dev' : 'mindcanvas'}
      >
        <CanvasLayer onBackgroundClick={onBackgroundClick}>
          {children}
        </CanvasLayer>
      </Tldraw>
    </div>
  )
}
