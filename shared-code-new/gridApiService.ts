/**
 * gridApiService.ts
 * Generic API service for grid list widgets — shared-code entry.
 * Handles all data fetching and action API interactions.
 * No domain-specific knowledge — all configuration supplied by the caller.
 * Place this file in: client/your-extensions/widgets/shared-code/gridApiService.ts
 */

import { httpGet, httpPostOrPut, httpPutNoBody } from 'widgets/shared-code/httpService'
import { getAllUrlParams, resolveExpression } from 'widgets/shared-code/urlParamService'
import {
  buildRowActionUrl,
  buildRowActionBody,
  buildCollectionPayload,
  buildArrayPayload
} from 'widgets/shared-code/payloadBuilder'

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
 * Resolves URL expression {placeholder} tokens from the current page URL params.
 * Optionally appends username if configured.
 *
 * @param webApiUrl - The API endpoint to fetch from
 * @param urlParams - URL filter expression e.g. 'caseId={caseId}'
 * @param useUsername - When true, appends &username={username} from the page URL
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
 * Supports GET, POST and PUT — with either URL query string or JSON body params.
 * API is expected to return a boolean — true = success, false = failure.
 *
 * @param apiUrl - The API endpoint URL
 * @param httpMethod - GET, POST or PUT
 * @param paramMode - 'query' for URL query string, 'body' for JSON request body
 * @param rowActionFields - Comma-separated fieldName:payloadKey pairs e.g. 'caseId:caseId'
 * @param rowData - The full row data object
 * @param useUsername - When true, appends username from the page URL
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
    // Parameters go in the URL query string
    const url = buildRowActionUrl(apiUrl, rowActionFields, rowData, username)
    console.log('gridApiService - callRowAction URL:', url)

    if (httpMethod === 'GET') {
      response = await httpGet<boolean>(url)
    } else {
      // PUT or POST with [FromQuery] — no body
      response = await httpPutNoBody<boolean>(url)
    }
  } else {
    // POST or PUT with JSON request body
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
 *
 * @param apiUrl - The API endpoint URL
 * @param httpMethod - POST or PUT
 * @param payloadMode - 'collection' or 'array'
 * @param checkedRows - Array of checked row data objects
 * @param collectionIdField - (collection mode) field in each row holding the ID e.g. 'caseId'
 * @param collectionIdKey - (collection mode) key name for the ID array e.g. 'caseIds'
 * @param globalActionFields - (array mode) comma-separated fieldName:payloadKey pairs
 * @param defaultValues - (both modes) comma-separated key:value pairs injected into payload
 */
export const callGlobalAction = async (
  apiUrl: string,
  httpMethod: 'POST' | 'PUT',
  payloadMode: 'collection' | 'array',
  checkedRows: any[],
  collectionIdField: string,
  collectionIdKey: string,
  globalActionFields: string,
  defaultValues: string
): Promise<ActionResult> => {
  if (!apiUrl) {
    return { ok: false, error: 'No API URL configured for global action.' }
  }

  const payload = payloadMode === 'collection'
    ? buildCollectionPayload(checkedRows, collectionIdField, collectionIdKey, defaultValues)
    : buildArrayPayload(checkedRows, globalActionFields, defaultValues)

  console.log('gridApiService - callGlobalAction payload:', JSON.stringify(payload))

  const response = await httpPostOrPut<boolean>(apiUrl, payload, httpMethod)

  if (!response.ok) {
    return { ok: false, error: response.error || `HTTP ${response.status}` }
  }

  // API returns boolean — false means failure even with HTTP 200
  if (response.data === false) {
    return { ok: false, error: 'API returned false — global action was not completed.' }
  }

  return { ok: true }
}
