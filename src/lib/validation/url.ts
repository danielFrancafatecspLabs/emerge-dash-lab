// URLs vindas de pessoas usuárias só entram em links e imagens se forem seguras.

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** http(s) absoluto ou caminho interno ("/comunidade/..."), nunca javascript:, data: ou //host. */
export function isSafeLink(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//') && !value.includes('\\')
  return isHttpUrl(value)
}
