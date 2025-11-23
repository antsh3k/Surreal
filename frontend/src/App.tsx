import { MindCanvas } from './components/canvas/MindCanvas'
import { ReactBitsTest } from './components/test/ReactBitsTest'

function App() {
  return (
    <MindCanvas>
      {/* React Bits Test Component */}
      {import.meta.env.DEV && <ReactBitsTest />}
    </MindCanvas>
  )
}

export default App
