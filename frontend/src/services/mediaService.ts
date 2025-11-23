interface MediaGenerationResponse {
  node_id: string
  media_type: 'image' | 'video'
  status: 'completed' | 'failed' | 'pending'
  task_id: string | null
  media_url: string | null
  error: string | null
  elapsed_time: number | null
  updated_node: any | null
}

interface MediaGenerationRequest {
  node_id: string
  media_type: 'image' | 'video'
  prompt: string
  node_concept?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class MediaService {
  private async downloadAndSaveMedia(mediaUrl: string, filename: string): Promise<string> {
    try {
      // Download the media from the remote URL
      const response = await fetch(mediaUrl)
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Create a local URL for the blob
      const localUrl = URL.createObjectURL(blob)
      
      // Optionally, you could save to a more persistent location
      // For now, we'll use the blob URL which works for the demo
      
      console.log(`✅ Downloaded and saved media: ${filename}`)
      return localUrl
      
    } catch (error) {
      console.error('Failed to download and save media:', error)
      // Return the original URL as fallback
      return mediaUrl
    }
  }

  async generateImage(nodeId: string, concept: string): Promise<{ localUrl: string; originalUrl: string }> {
    const request: MediaGenerationRequest = {
      node_id: nodeId,
      media_type: 'image',
      prompt: `Generate a high-quality, professional illustration for the concept: "${concept}". The image should be educational, clean, and suitable for a knowledge visualization interface. Style: modern, minimalist, informative diagram or illustration.`,
      node_concept: concept
    }

    try {
      console.log('🎨 Generating image for concept:', concept)
      
      const response = await fetch(`${API_BASE_URL}/api/generate-media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: MediaGenerationResponse = await response.json()
      
      if (result.status === 'failed' || result.error) {
        throw new Error(result.error || 'Image generation failed')
      }

      if (!result.media_url) {
        throw new Error('No media URL returned from API')
      }

      // Download and save the image locally
      const filename = `generated-image-${nodeId}-${Date.now()}.jpg`
      const localUrl = await this.downloadAndSaveMedia(result.media_url, filename)
      
      console.log('✅ Image generation completed:', {
        nodeId,
        originalUrl: result.media_url,
        localUrl
      })

      return {
        localUrl,
        originalUrl: result.media_url
      }

    } catch (error) {
      console.error('❌ Image generation failed:', error)
      throw error
    }
  }

  async generateVideo(nodeId: string, concept: string): Promise<{ localUrl: string; originalUrl: string }> {
    const request: MediaGenerationRequest = {
      node_id: nodeId,
      media_type: 'video',
      prompt: `Create an educational video explaining the concept: "${concept}". The video should be informative, engaging, and suitable for learning. Focus on clear explanations and visual demonstrations.`,
      node_concept: concept
    }

    try {
      console.log('🎬 Generating video for concept:', concept)
      
      const response = await fetch(`${API_BASE_URL}/api/generate-media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: MediaGenerationResponse = await response.json()
      
      if (result.status === 'failed' || result.error) {
        throw new Error(result.error || 'Video generation failed')
      }

      if (!result.media_url) {
        throw new Error('No media URL returned from API')
      }

      // Download and save the video locally
      const filename = `generated-video-${nodeId}-${Date.now()}.mp4`
      const localUrl = await this.downloadAndSaveMedia(result.media_url, filename)
      
      console.log('✅ Video generation completed:', {
        nodeId,
        originalUrl: result.media_url,
        localUrl
      })

      return {
        localUrl,
        originalUrl: result.media_url
      }

    } catch (error) {
      console.error('❌ Video generation failed:', error)
      throw error
    }
  }

  // Health check for the media generation service
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      return response.ok
    } catch (error) {
      console.error('Media service connection test failed:', error)
      return false
    }
  }
}

export const mediaService = new MediaService()
export type { MediaGenerationResponse }