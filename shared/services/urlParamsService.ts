/**
 * urlParamsService.ts
 * Generic URL parameter utilities — reusable across any widget.
 */

/**
 * Parses all query string parameters from a URL into a lowercase key-value map.
 * @param url - Full URL string to parse
 * @returns Object with lowercased parameter names as keys
 */
export const getAllUrlParams = (url: string): Record<string, any> => {
  const queryString = url ? url.split('?')[1] : window.location.search.slice(1)
  const obj: Record<string, any> = {}

  if (!queryString) return obj

  queryString.split('#')[0].split('&').forEach(part => {
    const a = part.split('=')
    const paramName = a[0].toLowerCase()
    const paramValue = typeof a[1] === 'undefined' ? true : a[1]

    if (!obj[paramName]) {
      obj[paramName] = paramValue
    } else if (typeof obj[paramName] === 'string') {
      obj[paramName] = [obj[paramName], paramValue]
    } else {
      obj[paramName].push(paramValue)
    }
  })

  return obj
}

/**
 * Resolves a filter expression template by replacing {placeholder} tokens
 * with values from the URL params or a provided value map.
 * @param expression - Template string e.g. "caseId={caseId}&crn={crn}"
 * @param valueMap - Map of placeholder names to replacement values
 * @returns Resolved expression string
 *
 * @example
 * resolveExpression('caseId={caseId}', { caseId: 'C001' })
 * // returns 'caseId=C001'
 */
export const resolveExpression = (
  expression: string,
  valueMap: Record<string, string>
): string => {
  if (!expression) return ''

  const regexp = /{(.*?)}/g
  const matches = Array.from(expression.matchAll(regexp))

  let resolved = expression
  matches.forEach((match: RegExpMatchArray) => {
    const key = match[1]
    if (valueMap[key] !== undefined) {
      resolved = resolved.replace(match[0], valueMap[key])
    }
  })

  return resolved
}

/**
 * Builds the value map used by resolveExpression from the current page URL
 * and an optional additional values object.
 * @param additionalValues - Extra values to merge into the map (take precedence over URL params)
 * @returns Combined value map
 */
export const buildValueMap = (
  additionalValues: Record<string, string> = {}
): Record<string, string> => {
  const urlParams = getAllUrlParams(window.location.href)
  return { ...urlParams, ...additionalValues }
}
