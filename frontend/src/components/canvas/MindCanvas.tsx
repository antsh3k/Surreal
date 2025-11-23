import { useEffect, useCallback } from 'react'
import { Tldraw, type Editor, useEditor, useValue, type TLUiComponents, type TldrawOptions } from 'tldraw'
import 'tldraw/tldraw.css'
import './MindCanvas.css'
import { ConceptShapeUtil } from '../../shapes/ConceptShapeUtil'
import { MinimalToolbar } from './MinimalToolbar'
import { ZoomControls } from './ZoomControls'

// Define options outside component to prevent re-creation on every render
const TLDRAW_OPTIONS: Partial<TldrawOptions> = {
  cameraOptions: {
    wheelBehavior: 'zoom',
    zoomSpeed: 1,
    zoomSteps: [0.1, 0.25, 0.5, 1, 2, 4, 8]
  }
}

interface MindCanvasProps {
  children?: React.ReactNode
  onBackgroundClick?: () => void
}


// Component to handle tool management, events, and camera sync
const CanvasController = ({ children, onBackgroundClick }: MindCanvasProps) => {
  const editor = useEditor()
  const camera = useValue('camera', () => editor.getCamera(), [editor])


  useEffect(() => {
    // Handle background clicks
    const listener = (info: any) => {
      if (info.type === 'canvas' && onBackgroundClick) {
        onBackgroundClick()
      }
    }

    const cleanup = editor.on('click', listener)
    
    return () => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [editor, onBackgroundClick])


  return (
    <>
      {/* Our custom minimal toolbar - inside Tldraw context */}
      <MinimalToolbar />
      
      {/* Zoom controls widget - inside Tldraw context */}
      <ZoomControls />
      
      {/* Camera-synced overlay for mind map nodes */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          transformOrigin: 'top left',
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
        }}
      >
        {/* React nodes that move with the camera */}
        {children}
      </div>
    </>
  )
}

export const MindCanvas = ({ children, onBackgroundClick }: MindCanvasProps) => {
  const handleMount = useCallback((editor: Editor) => {
    try {
      // Use mergeRemoteChanges to prevent store listener infinite loops
      editor.store.mergeRemoteChanges(() => {
        // Clear any existing shapes
        const existingShapes = editor.getCurrentPageShapes()
        if (existingShapes.length > 0) {
          editor.deleteShapes(existingShapes.map(s => s.id))
        }
        
        // Set initial camera and default to hand tool
        editor.setCamera({ x: 0, y: 0, z: 1 })
        editor.setCurrentTool('hand')
      })
      
      console.log('🎨 Tldraw canvas initialized with hand tool for navigation')
    } catch (error) {
      console.warn('Could not initialize tldraw canvas:', error)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw 
          autoFocus={false}
          onMount={handleMount}
          shapeUtils={[ConceptShapeUtil]}
          persistenceKey={import.meta.env.DEV ? 'mindcanvas-dev' : 'mindcanvas'}
          options={TLDRAW_OPTIONS}
          components={{
            Toolbar: () => null, // Hide default toolbar
            ActionsMenu: () => null, // Hide actions menu
            HelpMenu: () => null, // Hide help menu
            ZoomMenu: () => null, // Hide zoom menu
            MainMenu: () => null, // Hide main menu
            PageMenu: null, // Hide page dropdown
            NavigationPanel: null, // Hide back/forward navigation
            QuickActions: null, // Hide undo/redo/delete/duplicate buttons
          }}
        >
          <CanvasController onBackgroundClick={onBackgroundClick}>
            {children}
          </CanvasController>
        </Tldraw>
    </div>
  )
}