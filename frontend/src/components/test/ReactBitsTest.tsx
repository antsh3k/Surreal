import { useState } from 'react'
import StarBorder from '../ui/StarBorder'
import { ShinyText } from '../ui/ShinyText'
import { BlurText } from '../ui/BlurText'

export const ReactBitsTest = () => {
  const [showEffects, setShowEffects] = useState(true)

  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="text-sm font-medium mb-3">React Bits Test</h3>
      
      <div className="space-y-4">
        {/* Star Border Test */}
        <div className="relative">
          <h4 className="text-xs text-gray-600 mb-2">Star Border Effect:</h4>
          {showEffects ? (
            <StarBorder 
              color="green" 
              thickness={1} 
              speed="2s"
              className="w-32"
            >
              <div className="flex items-center justify-center text-sm">
                High Preference
              </div>
            </StarBorder>
          ) : (
            <div className="w-32 h-12 bg-white border rounded-lg flex items-center justify-center text-sm">
              High Preference
            </div>
          )}
        </div>

        {/* Shiny Text Test */}
        <div>
          <h4 className="text-xs text-gray-600 mb-2">Shiny Text Effect:</h4>
          {showEffects ? (
            <ShinyText text="Important Concept" />
          ) : (
            <span>Important Concept</span>
          )}
        </div>

        {/* Blur Text Test */}
        <div>
          <h4 className="text-xs text-gray-600 mb-2">Blur Text Effect:</h4>
          <BlurText text="Loading..." />
        </div>

        <button
          onClick={() => setShowEffects(!showEffects)}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
        >
          {showEffects ? 'Disable' : 'Enable'} Effects
        </button>
      </div>

      {/* Integration Status */}
      <div className="mt-3 pt-3 border-t text-xs">
        <span className="text-green-600">✅ React Bits: Working</span>
      </div>
    </div>
  )
}

