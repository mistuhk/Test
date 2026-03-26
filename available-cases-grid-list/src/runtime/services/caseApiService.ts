/**
 * caseApiService.ts
 * Widget-specific API service for available-cases-grid-list.
 * Uses httpService for all HTTP interactions.
 * Widget-specific — not shared.
 */

import { httpGet, httpPost } from '../../../../../shared/services/httpService'
import { resolveExpression, getAllUrlParams } from '../../../../../shared/services/urlParamsService'
import { buildGlobalPayload, buildRowActionUrl } from './payloadBuilder'

export interface FetchCasesResult {
  data: any[]
  ok: boolean
  error?: string
}

export interface ActionResult {
  ok: boolean
  error?: string
}

/**
 * Fetches the list of available cases from the configured API endpoint.
 */
export const fetchCases = async (
  webApiUrl: string,
  urlParams: string,
  useUsername: boolean
): Promise<FetchCasesResult> => {
  if (!webApiUrl) return { data: [], ok: false, error: 'No API URL configured.' }

  const urlParamsObj = getAllUrlParams(window.location.href)

  let finalUrl = webApiUrl

  if (urlParams) {
    const valueMap: Record<string, string> = { ...urlParamsObj }
    const resolvedParams = resolveExpression(urlParams, valueMap)
    finalUrl = `${webApiUrl}?${resolvedParams}`
  }

  if (useUsername && urlParamsObj['username']) {
    finalUrl += `${urlParams ? '&' : '?'}username=${urlParamsObj['username']}`
  }

  console.log('caseApiService - fetchCases URL:', finalUrl)

  const response = await httpGet<any[]>(finalUrl)

  if (!response.ok) {
    return { data: [], ok: false, error: response.error || `HTTP ${response.status}` }
  }

  const data = Array.isArray(response.data) ? response.data : []
  return { data, ok: true }
}

/**
 * Calls the per-row action API for a single case.
 */
export const callRowAction = async (
  listButton1APIUrl: string,
  button1ParamExpression: string,
  rowData: any,
  useUsername: boolean
): Promise<ActionResult> => {
  const urlParamsObj = getAllUrlParams(window.location.href)
  const username = useUsername ? urlParamsObj['username'] : undefined

  const url = buildRowActionUrl(
    listButton1APIUrl,
    button1ParamExpression,
    rowData,
    username
  )

  if (!url) return { ok: false, error: 'No API URL configured for row action.' }

  console.log('caseApiService - callRowAction URL:', url)

  const response = await httpGet(url)
  return { ok: response.ok, error: response.error }
}

/**
 * Calls the global action API for multiple selected cases.
 * Sends a collection payload as POST or PUT.
 */
export const callGlobalAction = async (
  globalButtonAPIUrl: string,
  globalButtonHttpMethod: string,
  checkedRows: any[],
  globalButtonPayloadFields: string,
  globalButtonDefaultValues: string,
  useUsername: boolean
): Promise<ActionResult> => {
  if (!globalButtonAPIUrl) {
    return { ok: false, error: 'No API URL configured for global action.' }
  }

  const urlParamsObj = getAllUrlParams(window.location.href)
  const username = useUsername ? urlParamsObj['username'] : undefined

  const payload = buildGlobalPayload(
    checkedRows,
    globalButtonPayloadFields,
    globalButtonDefaultValues,
    username
  )

  console.log('caseApiService - callGlobalAction payload:', JSON.stringify(payload))

  const method = (globalButtonHttpMethod === 'PUT') ? 'PUT' : 'POST'
  const response = await httpPost(globalButtonAPIUrl, payload, method)

  return { ok: response.ok, error: response.error }
}
