import type {
  InitRequest,
  InitResponse,
  ExpandRequest,
  ExpandResponse,
  PreferenceRequest,
  PreferenceResponse,
  AnalyticsRequest,
  AnalyticsResponse,
  SuggestionsRequest,
  SuggestionsResponse,
  MediaRequest,
  MediaResponse,
  MediaStatusRequest,
  HealthResponse,
  ApiError
} from '../types/api'

export class ApiClient {
  private baseURL: string
  private timeout: number
  private sessionId: string | null = null

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000')
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Session-ID': this.sessionId || ''
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    config.signal = controller.signal

    try {
      const response = await fetch(url, config)
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || 
          errorData.detail || 
          `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`)
        }
        throw error
      }
      
      throw new Error('Unknown API error')
    }
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health')
  }

  async init(request: InitRequest): Promise<InitResponse> {
    return this.request<InitResponse>('/api/init', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async expand(request: ExpandRequest): Promise<ExpandResponse> {
    return this.request<ExpandResponse>('/api/expand', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async updatePreference(request: PreferenceRequest): Promise<PreferenceResponse> {
    return this.request<PreferenceResponse>('/api/preference', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async getAnalytics(request: AnalyticsRequest = {}): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async getSuggestions(request: SuggestionsRequest): Promise<SuggestionsResponse> {
    return this.request<SuggestionsResponse>('/api/suggest-next', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async generateMedia(request: MediaRequest): Promise<MediaResponse> {
    return this.request<MediaResponse>('/api/generate-media', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async checkMediaStatus(request: MediaStatusRequest): Promise<MediaResponse> {
    return this.request<MediaResponse>('/api/media-status', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  resetSession(): void {
    this.sessionId = this.generateSessionId()
  }
}

// Singleton instance
export const apiClient = new ApiClient()