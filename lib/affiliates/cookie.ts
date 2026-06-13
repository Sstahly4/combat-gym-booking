import { cookies } from 'next/headers'
import { AFFILIATE_REF_COOKIE } from '@/lib/affiliates/constants'
import { normalizeAffiliateCode } from '@/lib/affiliates/code'

export async function readAffiliateRefCookie(): Promise<string | null> {
  const jar = await cookies()
  const raw = jar.get(AFFILIATE_REF_COOKIE)?.value
  if (!raw) return null
  const code = normalizeAffiliateCode(raw)
  return code || null
}
