import { useState } from 'react'
import { conceptService } from '../../services/conceptService'
import { apiClient } from '../../services/apiClient'

export const ApiConnectionTest = () => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setStatus('testing')
    setResult(null)
    setError(null)
    
    try {
      // Test health endpoint
      console.log('Testing health endpoint...')
      const health = await apiClient.health()
      console.log('Health response:', health)
      
      setResult({ health })
      setStatus('success')
      
    } catch (err) {
      console.error('Connection test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  const testInitEndpoint = async () => {
    setStatus('testing')
    setResult(null)
    setError(null)
    
    try {
      console.log('Testing init endpoint...')
      const response = await conceptService.initializeTopic('Test Topic')
      console.log('Init response:', response)
      
      setResult({ init: response })
      setStatus('success')
      
    } catch (err) {
      console.error('Init test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="text-lg font-semibold mb-3">API Connection Test</h3>
      
      <div className="space-y-2">
        <button
          onClick={testConnection}
          disabled={status === 'testing'}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {status === 'testing' ? 'Testing...' : 'Test Health Endpoint'}
        </button>
        
        <button
          onClick={testInitEndpoint}
          disabled={status === 'testing'}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {status === 'testing' ? 'Testing...' : 'Test Init Endpoint'}
        </button>
      </div>
      
      {status === 'success' && result && (
        <div className="mt-3 p-2 bg-green-100 border border-green-400 rounded text-sm">
          <div className="font-semibold text-green-800">✅ Success!</div>
          <pre className="text-xs mt-1 overflow-auto max-h-32">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {status === 'error' && error && (
        <div className="mt-3 p-2 bg-red-100 border border-red-400 rounded text-sm">
          <div className="font-semibold text-red-800">❌ Error</div>
          <div className="text-red-700 text-xs mt-1">{error}</div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Backend: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
      </div>
    </div>
  )
}