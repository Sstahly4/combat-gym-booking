import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const PREFIX = 'enc:v1:'
const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function deriveKey(): Buffer {
  const secret = process.env.AFFILIATE_PAYOUT_ENCRYPTION_KEY
  if (!secret || secret.length < 16) {
    throw new Error('AFFILIATE_PAYOUT_ENCRYPTION_KEY is not configured')
  }
  return scryptSync(secret, 'affiliate-payout-details', 32)
}

export function encryptAffiliatePayoutDetails(plaintext: string): string {
  if (!plaintext.trim()) return ''
  const key = deriveKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([iv, tag, encrypted]).toString('base64url')
  return `${PREFIX}${payload}`
}

export function decryptAffiliatePayoutDetails(ciphertext: string | null | undefined): string {
  if (!ciphertext?.startsWith(PREFIX)) return ciphertext || ''
  try {
    const key = deriveKey()
    const raw = Buffer.from(ciphertext.slice(PREFIX.length), 'base64url')
    const iv = raw.subarray(0, IV_LENGTH)
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const encrypted = raw.subarray(IV_LENGTH + TAG_LENGTH)
    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    return '[unable to decrypt]'
  }
}

export function isAffiliateEncryptionConfigured(): boolean {
  const secret = process.env.AFFILIATE_PAYOUT_ENCRYPTION_KEY
  return Boolean(secret && secret.length >= 16)
}
