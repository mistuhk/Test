/**
 * payloadBuilder.ts
 * Generic payload construction utilities — self-contained within custom-grid-list.
 * No domain-specific knowledge — all field names and keys are supplied by the caller.
 */

/**
 * Parses a comma-separated key:value string into a plain object.
 * e.g. 'caseStatus:AVAILABLE,casePool:DCR_AUTO'
 *   →  { caseStatus: 'AVAILABLE', casePool: 'DCR_AUTO' }
 */
export const parseDefaultValues = (
  defaultValues: string
): Record<string, string> => {
  if (!defaultValues) return {}

  return defaultValues.split(',').reduce((acc, pair) => {
    const parts = pair.trim().split(':')
    if (parts.length >= 2) {
      acc[parts[0].trim()] = parts.slice(1).join(':').trim()
    }
    return acc
  }, {} as Record<string, string>)
}

/**
 * Parses a comma-separated fieldName:payloadKey string into a column map.
 * e.g. 'caseId:caseId,crn:crn'
 *   →  [{ field: 'caseId', key: 'caseId' }, { field: 'crn', key: 'crn' }]
 */
export const parseFieldMappings = (
  fieldMappings: string
): Array<{ field: string; key: string }> => {
  if (!fieldMappings) return []

  return fieldMappings.split(',').reduce((acc, pair) => {
    const parts = pair.trim().split(':')
    if (parts.length >= 2) {
      acc.push({ field: parts[0].trim(), key: parts[1].trim() })
    }
    return acc
  }, [] as Array<{ field: string; key: string }>)
}

/**
 * Builds the per-row action URL for query string mode.
 * Parameters are appended as URL query string — for APIs using [FromQuery].
 *
 * @param baseUrl - The base API endpoint URL
 * @param rowActionFields - Comma-separated fieldName:payloadKey pairs e.g. 'caseId:caseId'
 * @param rowData - The row data object
 * @param username - Optional username from page URL params
 * @returns Fully resolved URL string with query params
 */
export const buildRowActionUrl = (
  baseUrl: string,
  rowActionFields: string,
  rowData: any,
  username?: string
): string => {
  if (!baseUrl) return ''

  const mappings = parseFieldMappings(rowActionFields)
  const params: string[] = []

  mappings.forEach(({ field, key }) => {
    const raw = rowData[field]
    if (raw !== undefined && raw !== null) {
      // Parse as integer if numeric, otherwise use as string
      const val = !isNaN(Number(raw)) && raw !== '' ? parseInt(String(raw), 10) : String(raw)
      params.push(`${key}=${val}`)
    }
  })

  if (username) params.push(`username=${username}`)

  return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl
}

/**
 * Builds the per-row action request body for body mode.
 * Parameters are sent as a JSON object — for REST APIs expecting a request body.
 *
 * @param rowActionFields - Comma-separated fieldName:payloadKey pairs
 * @param rowData - The row data object
 * @param username - Optional username from page URL params
 * @returns Request body object
 */
export const buildRowActionBody = (
  rowActionFields: string,
  rowData: any,
  username?: string
): Record<string, any> => {
  const mappings = parseFieldMappings(rowActionFields)
  const body: Record<string, any> = {}

  mappings.forEach(({ field, key }) => {
    const raw = rowData[field]
    if (raw !== undefined && raw !== null) {
      body[key] = !isNaN(Number(raw)) && raw !== '' ? parseInt(String(raw), 10) : raw
    }
  })

  if (username) body['username'] = username

  return body
}

/**
 * Builds a 'collection' mode global action payload.
 * Collects ID values from checked rows into a single array under a configurable key,
 * then merges in fixed default properties.
 *
 * @param checkedRows - Array of checked row data objects
 * @param collectionIdField - Field in each row holding the ID value e.g. 'caseId'
 * @param collectionIdKey - Key name for the ID array in the payload e.g. 'caseIds'
 * @param defaultValues - Comma-separated key:value pairs e.g. 'caseStatus:AVAILABLE'
 * @returns Single payload object e.g. { caseIds: [1001, 1002], caseStatus: 'AVAILABLE' }
 */
export const buildCollectionPayload = (
  checkedRows: any[],
  collectionIdField: string,
  collectionIdKey: string,
  defaultValues: string
): Record<string, any> => {
  const ids = checkedRows
    .map(row => {
      const raw = row[collectionIdField]
      if (raw === undefined || raw === null) return null
      const parsed = parseInt(String(raw), 10)
      return isNaN(parsed) ? String(raw) : parsed
    })
    .filter(id => id !== null)

  const defaults = parseDefaultValues(defaultValues)

  return {
    [collectionIdKey]: ids,
    ...defaults
  }
}

/**
 * Builds an 'array' mode global action payload.
 * Each checked row becomes one object in the returned array.
 * Fixed default properties are injected into every item.
 *
 * @param checkedRows - Array of checked row data objects
 * @param globalActionFields - Comma-separated fieldName:payloadKey pairs
 * @param defaultValues - Comma-separated key:value pairs injected into every item
 * @returns Array of payload objects
 */
export const buildArrayPayload = (
  checkedRows: any[],
  globalActionFields: string,
  defaultValues: string
): Record<string, any>[] => {
  const mappings = parseFieldMappings(globalActionFields)
  const defaults = parseDefaultValues(defaultValues)

  return checkedRows.map(row => {
    const item: Record<string, any> = {}

    mappings.forEach(({ field, key }) => {
      const raw = row[field]
      if (raw !== undefined && raw !== null) {
        item[key] = !isNaN(Number(raw)) && raw !== '' ? parseInt(String(raw), 10) : raw
      }
    })

    return { ...item, ...defaults }
  })
}
