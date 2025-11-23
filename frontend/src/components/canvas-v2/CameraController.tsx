import { motion } from 'framer-motion'
import type { CameraControls } from './hooks/useCamera'

interface CameraControllerProps {
  camera: CameraControls
}

export const CameraController = ({ camera }: CameraControllerProps) => {
  const { zoomIn, zoomOut, resetCamera, fitToView } = camera
  const currentZoom = Math.round(camera.camera.zoom * 100)

  return (
    <motion.div 
      className="absolute bottom-6 right-6 z-40 flex flex-col gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Zoom Controls */}
      <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Zoom In */}
        <button
          onClick={zoomIn}
          disabled={camera.camera.zoom >= 4}
          className="p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom In"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
          </svg>
        </button>

        {/* Current Zoom Level */}
        <div className="px-3 py-2 text-xs font-medium text-gray-600 text-center border-b border-gray-100 min-w-[60px]">
          {currentZoom}%
        </div>

        {/* Zoom Out */}
        <button
          onClick={zoomOut}
          disabled={camera.camera.zoom <= 0.1}
          className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom Out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
      </div>

      {/* Additional Controls */}
      <div className="flex flex-col gap-2">
        {/* Fit to View */}
        <button
          onClick={() => fitToView()}
          className="p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Fit to View"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>

        {/* Reset Camera */}
        <button
          onClick={resetCamera}
          className="p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Reset View"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      </div>

      {/* Pan Instructions - subtle hint */}
      <div className="text-xs text-gray-500 text-center max-w-[100px] leading-tight">
        Drag to pan
        <br />
        Scroll to zoom
      </div>
    </motion.div>
  )
}