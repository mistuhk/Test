/**
 * httpService.ts
 * Generic HTTP service — self-contained within custom-grid-list.
 * Handles credentials, content-type headers and consistent error handling
 * for all HTTP interactions in this widget.
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
 * Parses a fetch Response safely — handles both JSON and empty bodies.
 */
const parseResponse = async <T>(response: Response): Promise<HttpResponse<T>> => {
  const text = await response.text()

  let data: T | null = null

  if (text) {
    try {
      data = JSON.parse(text) as T
    } catch {
      // Non-JSON response — treat raw text as data if 2xx, else as error
      if (response.ok) {
        data = text as unknown as T
      } else {
        return {
          data: null,
          ok: false,
          status: response.status,
          error: text || `HTTP ${response.status}`
        }
      }
    }
  }

  return { data, ok: response.ok, status: response.status }
}

/**
 * Performs a GET request.
 * Sends session cookies automatically via credentials: 'include'.
 */
export const httpGet = async <T = any>(url: string): Promise<HttpResponse<T>> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })
    return parseResponse<T>(response)
  } catch (error) {
    console.error('httpService - GET error:', error)
    return { data: null, ok: false, status: 0, error: String(error) }
  }
}

/**
 * Performs a POST or PUT request with a JSON body.
 * Sends session cookies automatically via credentials: 'include'.
 */
export const httpPostOrPut = async <T = any>(
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
    return parseResponse<T>(response)
  } catch (error) {
    console.error(`httpService - ${method} error:`, error)
    return { data: null, ok: false, status: 0, error: String(error) }
  }
}

/**
 * Performs a PUT request with no body.
 * For ASP.NET endpoints that use [FromQuery] — parameters are in the URL query string.
 * Sends session cookies automatically via credentials: 'include'.
 */
export const httpPutNoBody = async <T = any>(url: string): Promise<HttpResponse<T>> => {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include'
    })
    return parseResponse<T>(response)
  } catch (error) {
    console.error('httpService - PUT (no body) error:', error)
    return { data: null, ok: false, status: 0, error: String(error) }
  }
}
