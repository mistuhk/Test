/**
 * httpService.ts
 * Generic HTTP service — reusable across any widget.
 * Handles credentials, content-type, and consistent error handling.
 */

export interface HttpResponse<T = any> {
  data: T | null
  ok: boolean
  status: number
  error?: string
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
}

/**
 * Performs a GET request and returns parsed JSON.
 * Sends cookies automatically via credentials: 'include'.
 */
export const httpGet = async <T = any>(url: string): Promise<HttpResponse<T>> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })

    const text = await response.text()

    let data: T | null = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      return {
        data: null,
        ok: false,
        status: response.status,
        error: `Failed to parse response as JSON. Raw response: ${text}`
      }
    }

    return { data, ok: response.ok, status: response.status }
  } catch (error) {
    console.error('httpService - GET error:', error)
    return { data: null, ok: false, status: 0, error: String(error) }
  }
}

/**
 * Performs a POST or PUT request with a JSON body.
 * Sends cookies automatically via credentials: 'include'.
 */
export const httpPost = async <T = any>(
  url: string,
  body: any,
  method: 'POST' | 'PUT' = 'POST'
): Promise<HttpResponse<T>> => {
  try {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(body)
    })

    const text = await response.text()

    let data: T | null = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      // Some APIs return no body on success — treat as ok if status is 2xx
      data = null
    }

    return { data, ok: response.ok, status: response.status }
  } catch (error) {
    console.error('httpService - POST/PUT error:', error)
    return { data: null, ok: false, status: 0, error: String(error) }
  }
}
