/**
 * Maps Stripe `requirements.currently_due` keys to user-facing step labels
 * for the P3 recovery card.
 *
 * Resolution order:
 *  1. `totp.*` prefix — checked first because the whole spec exists for this
 *  2. Exact key match
 *  3. Prefix match (most-specific prefix wins — entries are ordered accordingly)
 *  4. Default fallback
 *
 * Confirmed keys from Stripe Dashboard (RCrachai / Chinnarach, Jun 2026):
 *   business_profile.url, business_type, external_account, representative,
 *   business_profile.product_description, tos_acceptance.date,
 *   business_profile.mcc
 */

export type RequirementLabel = {
  en: string
  th: string
}

const TOTP: RequirementLabel = {
  en: 'Set up your security code app (Google Authenticator)',
  th: 'ตั้งค่าระบบรหัสความปลอดภัย (Google Authenticator)',
}

const EXACT_MAP: Record<string, RequirementLabel> = {
  business_type: {
    en: 'Select your business type',
    th: 'เลือกประเภทธุรกิจ',
  },
  external_account: {
    en: 'Add your bank account',
    th: 'เพิ่มบัญชีธนาคาร',
  },
  representative: {
    en: 'Verify your identity',
    th: 'ยืนยันตัวตน',
  },
  'individual.id_number': {
    en: 'Enter your ID number',
    th: 'กรอกเลขบัตรประชาชน / เลขประจำตัว',
  },
  'individual.verification.document': {
    en: 'Upload your ID document',
    th: 'อัปโหลดเอกสารยืนยันตัวตน',
  },
  'individual.verification.additional_document': {
    en: 'Upload additional verification document',
    th: 'อัปโหลดเอกสารเพิ่มเติม',
  },
  // Confirmed tos_acceptance key from Stripe Dashboard
  'tos_acceptance.date': {
    en: "Accept Stripe's terms of service",
    th: 'ยอมรับข้อกำหนดของ Stripe',
  },
  // Confirmed business_profile keys from Stripe Dashboard
  'business_profile.url': {
    en: 'Add your business website',
    th: 'เพิ่มเว็บไซต์ธุรกิจ',
  },
  'business_profile.product_description': {
    en: 'Describe your services',
    th: 'อธิบายบริการของคุณ',
  },
  'business_profile.mcc': {
    en: 'Select your business category',
    th: 'เลือกหมวดหมู่ธุรกิจ',
  },
}

type PrefixEntry = RequirementLabel & { prefix: string }

// Most-specific prefixes first — the first match wins.
const PREFIX_MAP: PrefixEntry[] = [
  { prefix: 'tos_acceptance.', en: "Accept Stripe's terms of service", th: 'ยอมรับข้อกำหนดของ Stripe' },
  { prefix: 'business_profile.', en: 'Complete your business profile', th: 'กรอกข้อมูลธุรกิจ' },
  { prefix: 'person.', en: 'Verify your identity', th: 'ยืนยันตัวตน' },
  { prefix: 'individual.', en: 'Complete identity verification', th: 'ยืนยันตัวตน' },
]

const DEFAULT_LABEL: RequirementLabel = {
  en: 'Complete remaining steps in Stripe',
  th: 'ดำเนินการขั้นตอนที่เหลือใน Stripe',
}

export function getRequirementLabel(key: string): RequirementLabel {
  // totp.* checked first — this is the authenticator step
  if (key === 'totp' || key.startsWith('totp.')) return TOTP

  const exact = EXACT_MAP[key]
  if (exact) return exact

  for (const entry of PREFIX_MAP) {
    if (key.startsWith(entry.prefix)) return { en: entry.en, th: entry.th }
  }

  return DEFAULT_LABEL
}

/**
 * Converts an array of `currently_due` keys to a deduplicated list of
 * user-facing labels. Adjacent duplicate EN labels are collapsed so the
 * recovery card doesn't repeat "Verify your identity" twice when both
 * `representative` and `person.*` are present.
 */
export function getRequirementLabels(
  currentlyDue: string[],
  lang: 'en' | 'th' = 'en',
): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const key of currentlyDue) {
    const label = getRequirementLabel(key)
    const text = lang === 'th' ? label.th : label.en
    if (!seen.has(text)) {
      seen.add(text)
      labels.push(text)
    }
  }
  return labels
}
