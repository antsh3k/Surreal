import { useEditor } from 'tldraw'

export function ZoomControls() {
  const editor = useEditor()

  const handleZoomIn = () => {
    editor.zoomIn(editor.getViewportScreenCenter(), { animation: { duration: 200 } })
  }

  const handleZoomOut = () => {
    editor.zoomOut(editor.getViewportScreenCenter(), { animation: { duration: 200 } })
  }

  const handleZoomToFit = () => {
    editor.zoomToFit({ animation: { duration: 200 } })
  }

  const handleResetZoom = () => {
    editor.setCamera({ x: 0, y: 0, z: 1 }, { animation: { duration: 200 } })
  }

  const buttonStyle = {
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    minWidth: '32px',
    minHeight: '32px',
    transition: 'background-color 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e5e5',
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e5e5',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        pointerEvents: 'auto',
      }}
    >
      {/* Zoom In */}
      <button
        title="Zoom in"
        style={buttonStyle}
        onClick={handleZoomIn}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>

      {/* Zoom Out */}
      <button
        title="Zoom out"
        style={buttonStyle}
        onClick={handleZoomOut}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>

      {/* Zoom to Fit */}
      <button
        title="Zoom to fit all"
        style={buttonStyle}
        onClick={handleZoomToFit}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>

      {/* Reset Zoom */}
      <button
        title="Reset zoom (100%)"
        style={buttonStyle}
        onClick={handleResetZoom}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      </button>
    </div>
  )
}