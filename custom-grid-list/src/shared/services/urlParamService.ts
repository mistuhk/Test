/**
 * urlParamService.ts
 * Generic URL parameter utilities — self-contained within custom-grid-list.
 */

/**
 * Parses all query string parameters from a URL into a lowercase key-value map.
 * e.g. '?caseId=C001&username=jsmith' → { caseid: 'C001', username: 'jsmith' }
 * Note: all keys are lowercased during parsing.
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
 * with values from the provided value map.
 * e.g. resolveExpression('caseId={caseId}', { caseid: 'C001' }) → 'caseId=C001'
 * Note: placeholder names are lowercased before lookup to match getAllUrlParams output.
 */
export const resolveExpression = (
  expression: string,
  valueMap: Record<string, any>
): string => {
  if (!expression) return ''

  const regexp = /{(.*?)}/g
  const matches = Array.from(expression.matchAll(regexp))

  let resolved = expression

  matches.forEach((match: RegExpMatchArray) => {
    const key = match[1].toLowerCase()
    if (valueMap[key] !== undefined) {
      resolved = resolved.replace(match[0], String(valueMap[key]))
    }
  })

  return resolved
}
