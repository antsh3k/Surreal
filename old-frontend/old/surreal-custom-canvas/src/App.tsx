// import React from 'react' // Not needed with new JSX transform
import { Provider } from 'jotai'
import CustomCanvas from './canvas/CustomCanvas'
import { globalStyles } from './stitches.config'

// Apply global styles
globalStyles()

function App() {
  return (
    <Provider>
      <div className="App">
        <CustomCanvas />
      </div>
    </Provider>
  )
}

export default App
