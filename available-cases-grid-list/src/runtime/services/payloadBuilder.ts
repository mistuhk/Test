/**
 * payloadBuilder.ts
 * Builds the collection payload for the available-cases-grid-list global action button.
 * Widget-specific — not shared.
 */

/**
 * Parses a comma-separated key:value string into a map.
 * e.g. "caseStatus:Available,destinationPool:DCR_AUTO"
 * → { caseStatus: 'Available', destinationPool: 'DCR_AUTO' }
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
 * Builds the collection payload for the global action button.
 * Each checked row becomes one item in the payload array.
 *
 * @param checkedRows - Array of row data objects from the checked rows
 * @param payloadFields - Comma-separated field names to extract from each row
 *                        e.g. "caseId,crn,fileRefNo"
 * @param defaultValues - Comma-separated key:value pairs to inject into every item
 *                        e.g. "caseStatus:Available,destinationPool:DCR_AUTO"
 * @param username - Optional username to inject if use_username_for_global_action is true
 * @returns Array of payload items ready to POST/PUT
 *
 * @example
 * buildGlobalPayload(
 *   [{ caseId: 'C001', crn: 'A0045523', fileRefNo: 'FR-001' }],
 *   'caseId,crn,fileRefNo',
 *   'caseStatus:Available,destinationPool:DCR_AUTO'
 * )
 * // returns [{ caseId: 'C001', crn: 'A0045523', fileRefNo: 'FR-001',
 * //            caseStatus: 'Available', destinationPool: 'DCR_AUTO' }]
 */
export const buildGlobalPayload = (
  checkedRows: any[],
  payloadFields: string,
  defaultValues: string,
  username?: string
): any[] => {
  const fields = payloadFields
    ? payloadFields.split(',').map(f => f.trim()).filter(Boolean)
    : []

  const defaults = parseDefaultValues(defaultValues)

  return checkedRows.map(row => {
    const item: Record<string, any> = {}

    // Extract configured fields from the row data
    fields.forEach(field => {
      if (row[field] !== undefined) {
        item[field] = row[field]
      }
    })

    // Inject default values
    Object.assign(item, defaults)

    // Inject username if configured
    if (username) {
      item['username'] = username
    }

    return item
  })
}

/**
 * Builds the URL for the per-row action button by resolving
 * the button1ParamExpression against the row data.
 *
 * @param baseUrl - The base API URL from config
 * @param paramExpression - Expression e.g. "caseId={caseId}&crn={crn}"
 * @param rowData - The row data object to resolve placeholders from
 * @param username - Optional username to append
 * @returns Full resolved URL string
 */
export const buildRowActionUrl = (
  baseUrl: string,
  paramExpression: string,
  rowData: any,
  username?: string
): string => {
  if (!baseUrl) return ''

  let params = paramExpression || ''

  // Replace {fieldName} placeholders with row values
  const regexp = /{(.*?)}/g
  const matches = Array.from(params.matchAll(regexp))
  matches.forEach((match: RegExpMatchArray) => {
    const field = match[1]
    params = params.replace(match[0], rowData[field] !== undefined ? String(rowData[field]) : '')
  })

  let url = params ? `${baseUrl}?${params}` : baseUrl

  if (username) {
    url += `${params ? '&' : '?'}username=${username}`
  }

  return url
}
