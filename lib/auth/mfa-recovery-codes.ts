/**
 * Server-side helpers for MFA recovery codes.
 *
 * Codes are 10 chars, base32-style (excluding lookalikes). We display them
 * grouped as `XXXXX-XXXXX`. We **never** store plaintext: only a SHA-256
 * hash with a per-installation pepper (env: `MFA_RECOVERY_PEPPER`).
 *
 * Pure functions are exported separately for unit testing.
 */
import { createHash, randomBytes } from 'crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

export const RECOVERY_CODE_BATCH_SIZE = 10

export function generatePlainRecoveryCode(): string {
  const bytes = randomBytes(10)
  let out = ''
  for (let i = 0; i < 10; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return `${out.slice(0, 5)}-${out.slice(5)}`
}

export function generatePlainRecoveryCodes(count = RECOVERY_CODE_BATCH_SIZE): string[] {
  const set = new Set<string>()
  while (set.size < count) {
    set.add(generatePlainRecoveryCode())
  }
  return Array.from(set)
}

export function hashRecoveryCode(plain: string): string {
  const normalised = plain.replace(/\s|-/g, '').toUpperCase()
  const pepper = process.env.MFA_RECOVERY_PEPPER ?? ''
  return createHash('sha256').update(`${pepper}:${normalised}`).digest('hex')
}
