/**
 * gridApiService.ts
 * Generic API service for custom-grid-list.
 * Handles all data loading and action interactions.
 * No domain-specific knowledge — all configuration supplied by the widget via config.
 */

import { httpGet, httpPostOrPut, httpPutNoBody } from './httpService'
import { getAllUrlParams, resolveExpression } from './urlParamService'
import {
  buildRowActionUrl,
  buildRowActionBody,
  buildCollectionPayload,
  buildArrayPayload
} from './payloadBuilder'

export interface FetchDataResult {
  data: any[]
  ok: boolean
  error?: string
}

export interface ActionResult {
  ok: boolean
  error?: string
}

// ─── Data fetching ────────────────────────────────────────────────────────────

/**
 * Fetches list data from the configured API endpoint.
 * Resolves URL expression placeholders from the current page URL params.
 * Optionally appends username if configured.
 */
export const fetchData = async (
  webApiUrl: string,
  urlParams: string,
  useUsername: boolean
): Promise<FetchDataResult> => {
  if (!webApiUrl) {
    return { data: [], ok: false, error: 'No API URL configured.' }
  }

  const pageParams = getAllUrlParams(window.location.href)
  let finalUrl = webApiUrl

  if (urlParams) {
    const resolved = resolveExpression(urlParams, pageParams)
    finalUrl = `${webApiUrl}?${resolved}`
  }

  if (useUsername && pageParams['username']) {
    finalUrl += `${urlParams ? '&' : '?'}username=${pageParams['username']}`
  }

  console.log('gridApiService - fetchData URL:', finalUrl)

  const response = await httpGet<any[]>(finalUrl)

  if (!response.ok) {
    return { data: [], ok: false, error: response.error || `HTTP ${response.status}` }
  }

  const data = Array.isArray(response.data) ? response.data : []
  return { data, ok: true }
}

// ─── Per-row action ───────────────────────────────────────────────────────────

/**
 * Calls the per-row action API.
 * Supports GET, POST, PUT with either query string or JSON body params.
 * API is expected to return a boolean — true = success, false = failure.
 */
export const callRowAction = async (
  apiUrl: string,
  httpMethod: 'GET' | 'POST' | 'PUT',
  paramMode: 'query' | 'body',
  rowActionFields: string,
  rowData: any,
  useUsername: boolean
): Promise<ActionResult> => {
  if (!apiUrl) {
    return { ok: false, error: 'No API URL configured for row action.' }
  }

  const pageParams = getAllUrlParams(window.location.href)
  const username = useUsername ? (pageParams['username'] || undefined) : undefined

  let response

  if (paramMode === 'query' || httpMethod === 'GET') {
    // Build URL with query string params
    const url = buildRowActionUrl(apiUrl, rowActionFields, rowData, username)
    console.log('gridApiService - callRowAction URL:', url)

    if (httpMethod === 'GET') {
      response = await httpGet<boolean>(url)
    } else {
      // PUT with [FromQuery] — no body
      response = await httpPutNoBody<boolean>(url)
    }
  } else {
    // POST or PUT with JSON body
    const body = buildRowActionBody(rowActionFields, rowData, username)
    console.log('gridApiService - callRowAction body:', JSON.stringify(body))
    response = await httpPostOrPut<boolean>(apiUrl, body, httpMethod)
  }

  if (!response.ok) {
    return { ok: false, error: response.error || `HTTP ${response.status}` }
  }

  // API returns boolean — false means failure even with HTTP 200
  if (response.data === false) {
    return { ok: false, error: 'API returned false — row action was not completed.' }
  }

  return { ok: true }
}

// ─── Global action ────────────────────────────────────────────────────────────

/**
 * Calls the global action API for multiple checked rows.
 * Builds either a 'collection' or 'array' payload depending on globalActionPayloadMode.
 * API is expected to return a boolean — true = success, false = failure.
 */
export const callGlobalAction = async (
  apiUrl: string,
  httpMethod: 'POST' | 'PUT',
  payloadMode: 'collection' | 'array',
  checkedRows: any[],
  // collection mode
  collectionIdField: string,
  collectionIdKey: string,
  // array mode
  globalActionFields: string,
  // both modes
  defaultValues: string
): Promise<ActionResult> => {
  if (!apiUrl) {
    return { ok: false, error: 'No API URL configured for global action.' }
  }

  let payload: any

  if (payloadMode === 'collection') {
    payload = buildCollectionPayload(
      checkedRows,
      collectionIdField,
      collectionIdKey,
      defaultValues
    )
  } else {
    payload = buildArrayPayload(
      checkedRows,
      globalActionFields,
      defaultValues
    )
  }

  console.log('gridApiService - callGlobalAction payload:', JSON.stringify(payload))

  const response = await httpPostOrPut<boolean>(apiUrl, payload, httpMethod)

  if (!response.ok) {
    return { ok: false, error: response.error || `HTTP ${response.status}` }
  }

  if (response.data === false) {
    return { ok: false, error: 'API returned false — global action was not completed.' }
  }

  return { ok: true }
}
