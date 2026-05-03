import { getWiseServerConfig, WiseConfigError } from '@/lib/wise/wise-config'

export type WiseFetchOptions = RequestInit & {
  idempotenceKey?: string
}

export class WiseApiError extends Error {
  status: number
  body: string

  constructor(message: string, status: number, body: string) {
    super(message)
    this.name = 'WiseApiError'
    this.status = status
    this.body = body
  }
}

/**
 * Low-level JSON fetch to Wise Platform API (sandbox or live).
 */
export async function wiseFetchJson<T>(path: string, options: WiseFetchOptions = {}): Promise<T> {
  let config
  try {
    config = getWiseServerConfig()
  } catch (e) {
    if (e instanceof WiseConfigError) throw e
    throw e
  }

  const url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${config.token}`)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.idempotenceKey) {
    headers.set('X-idempotence-uuid', options.idempotenceKey)
  }

  const { idempotenceKey: _omit, ...rest } = options
  const res = await fetch(url, {
    ...rest,
    headers,
  })

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: string }).message)
        : res.statusText
    throw new WiseApiError(msg || 'Wise API error', res.status, text)
  }

  return data as T
}
