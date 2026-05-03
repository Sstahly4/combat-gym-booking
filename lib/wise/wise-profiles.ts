import { wiseFetchJson } from '@/lib/wise/wise-http'

export type WiseProfileSummary = {
  id: number
  type?: string
}

/** List profiles for the authenticated token (personal + business). */
export async function wiseListProfiles(): Promise<WiseProfileSummary[]> {
  return wiseFetchJson<WiseProfileSummary[]>('/v2/profiles', { method: 'GET' })
}

export function pickBusinessProfileId(profiles: WiseProfileSummary[]): number | null {
  const business = profiles.find((p) => p.type === 'business')
  if (business) return business.id
  return profiles[0]?.id ?? null
}

export type WiseBalanceSummary = {
  id: number
  currency: string
  amount: { value: number; currency: string }
}

export async function wiseListStandardBalances(profileId: number): Promise<WiseBalanceSummary[]> {
  return wiseFetchJson<WiseBalanceSummary[]>(
    `/v4/profiles/${profileId}/balances?types=STANDARD`,
    { method: 'GET' }
  )
}
