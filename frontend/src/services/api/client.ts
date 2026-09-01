const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public detail?: any,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface FetchOptions extends RequestInit {
  data?: any
}

export const apiClient = {
  get: (url: string, options?: FetchOptions) => request('GET', url, options),
  post: (url: string, options?: FetchOptions) => request('POST', url, options),
  put: (url: string, options?: FetchOptions) => request('PUT', url, options),
  patch: (url: string, options?: FetchOptions) => request('PATCH', url, options),
  delete: (url: string, options?: FetchOptions) => request('DELETE', url, options),
}

async function request(method: string, url: string, options: FetchOptions = {}): Promise<any> {
  const { data, headers: customHeaders, ...restOptions } = options

  const headers = new Headers(customHeaders)
  
  if (data && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem('access_token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    ...restOptions,
  }

  if (data) {
    fetchOptions.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, fetchOptions)

    // Handle 204 No Content
    if (response.status === 204) {
      return null
    }

    let responseData
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      responseData = await response.text()
    }

    if (!response.ok) {
      // If 401 Unauthorized, we might want to trigger a logout or token clear
      if (response.status === 401) {
        localStorage.removeItem('access_token')
        // Optional: Dispatch a custom event to force UI re-render or redirect
        window.dispatchEvent(new Event('auth-unauthorized'))
      }

      const message = responseData?.message || responseData?.detail || response.statusText
      const errorCode = responseData?.error_code
      throw new ApiError(response.status, message, responseData?.detail, errorCode)
    }

    return responseData
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    // Network errors or JSON parsing errors
    throw new ApiError(0, error instanceof Error ? error.message : 'Unknown network error')
  }
}
