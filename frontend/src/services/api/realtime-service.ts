/**
 * services/api/realtime-service.ts — WebSocket client for real-time queue & status updates.
 */

export type RealtimeEventType =
  | 'CONNECTED'
  | 'QUEUE_JOINED'
  | 'QUEUE_POSITION_CHANGED'
  | 'ETA_UPDATED'
  | 'CENTRE_STATUS_CHANGED'
  | 'PROCESSING_STARTED'
  | 'PROCESSING_COMPLETED'
  | 'PING'

export interface RealtimeEvent<T = any> {
  event: RealtimeEventType
  data: T
  ts: string
}

export type RealtimeListener<T = any> = (data: T, event: RealtimeEvent<T>) => void

class RealtimeService {
  private ws: WebSocket | null = null
  private listeners: Map<string, Set<RealtimeListener>> = new Map()
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isExplicitlyClosed = false
  private currentToken: string | null = null

  /**
   * Connect to the WebSocket gateway using the provided or stored JWT token.
   */
  connect(token?: string) {
    const jwt = token || localStorage.getItem('access_token') || localStorage.getItem('officer_token')
    if (!jwt) {
      console.warn('[Realtime] No JWT token available for WebSocket connection.')
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentToken === jwt) {
      return
    }

    this.disconnect()
    this.isExplicitlyClosed = false
    this.currentToken = jwt

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const wsBase = apiBase.replace(/^http/, 'ws')
    const wsUrl = `${wsBase}/v1/realtime/ws?token=${encodeURIComponent(jwt)}`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.info('[Realtime] WebSocket connected')
        this.startPing()
      }

      this.ws.onmessage = (event) => {
        try {
          const parsed: RealtimeEvent = JSON.parse(event.data)
          this.dispatchEvent(parsed)
        } catch (e) {
          console.error('[Realtime] Failed to parse message:', event.data, e)
        }
      }

      this.ws.onclose = (event) => {
        this.stopPing()
        if (!this.isExplicitlyClosed && event.code !== 1008) {
          console.warn('[Realtime] Disconnected. Reconnecting in 3s...')
          this.reconnectTimer = setTimeout(() => this.connect(this.currentToken || undefined), 3000)
        }
      }

      this.ws.onerror = (error) => {
        console.warn('[Realtime] WebSocket error:', error)
      }
    } catch (e) {
      console.error('[Realtime] Connection failed to start:', e)
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true
    this.stopPing()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      try {
        this.ws.close()
      } catch {}
      this.ws = null
    }
  }

  /**
   * Subscribe to a specific event type, or '*' for all events.
   * Returns an unsubscribe function.
   */
  subscribe<T = any>(eventType: RealtimeEventType | '*', callback: RealtimeListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    return () => {
      const set = this.listeners.get(eventType)
      if (set) {
        set.delete(callback)
      }
    }
  }

  private dispatchEvent(event: RealtimeEvent) {
    // Specific event listeners
    const specific = this.listeners.get(event.event)
    if (specific) {
      specific.forEach((cb) => {
        try {
          cb(event.data, event)
        } catch (err) {
          console.error(`[Realtime] Listener error on ${event.event}:`, err)
        }
      })
    }

    // Catch-all wildcard listeners
    const wildcard = this.listeners.get('*')
    if (wildcard) {
      wildcard.forEach((cb) => {
        try {
          cb(event.data, event)
        } catch (err) {
          console.error('[Realtime] Wildcard listener error:', err)
        }
      })
    }
  }

  private startPing() {
    this.stopPing()
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
      }
    }, 30000)
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}

export const realtimeService = new RealtimeService()
