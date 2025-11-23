import { useEditor, useValue } from 'tldraw'

export function MinimalToolbar() {
  const editor = useEditor()
  const currentTool = useValue('current tool', () => editor.getCurrentToolId(), [editor])

  const handleToolSelect = (toolId: string) => {
    editor.setCurrentTool(toolId)
  }

  const buttonStyle = (isActive: boolean) => ({
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? 'white' : '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    minWidth: '40px',
    minHeight: '40px',
    transition: 'all 0.2s ease',
  })

  return (
    <div 
      style={{
        position: 'fixed',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '6px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        pointerEvents: 'auto',
      }}
    >
      {/* Hand Tool */}
      <button
        title="Hand tool (for panning)"
        style={buttonStyle(currentTool === 'hand')}
        onClick={() => handleToolSelect('hand')}
        onMouseEnter={(e) => {
          if (currentTool === 'hand') {
            e.currentTarget.style.backgroundColor = '#2563eb'
            e.currentTarget.style.transform = 'scale(1.05)'
          } else {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
            e.currentTarget.style.transform = 'scale(1.05)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = currentTool === 'hand' ? '#3b82f6' : 'transparent'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12L12 15L15 12M12 4V15"/>
          <path d="M20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12"/>
        </svg>
      </button>

      {/* Select Tool */}
      <button
        title="Select tool (for nodes)"
        style={buttonStyle(currentTool === 'select')}
        onClick={() => handleToolSelect('select')}
        onMouseEnter={(e) => {
          if (currentTool === 'select') {
            e.currentTarget.style.backgroundColor = '#2563eb'
            e.currentTarget.style.transform = 'scale(1.05)'
          } else {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
            e.currentTarget.style.transform = 'scale(1.05)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = currentTool === 'select' ? '#3b82f6' : 'transparent'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3L21 12L12 21L9 12L3 3Z"/>
        </svg>
      </button>
    </div>
  )
}