export class WiseConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WiseConfigError'
  }
}

export type WiseResolvedConfig = {
  baseUrl: string
  token: string
}

/**
 * Server-only Wise API config. Uses personal API token until OAuth is wired.
 * @see https://docs.wise.com/api-reference
 */
export function getWiseServerConfig(): WiseResolvedConfig {
  const baseRaw = process.env.WISE_API_BASE?.trim() || 'https://api.wise-sandbox.com'
  const baseUrl = baseRaw.replace(/\/$/, '')
  const token = process.env.WISE_PERSONAL_API_TOKEN?.trim()
  if (!token) {
    throw new WiseConfigError('WISE_PERSONAL_API_TOKEN is not configured.')
  }
  return { baseUrl, token }
}

export function isWiseSandboxDebugEnabled(): boolean {
  return process.env.WISE_SANDBOX_ROUTES_ENABLED === '1' || process.env.WISE_SANDBOX_ROUTES_ENABLED === 'true'
}
