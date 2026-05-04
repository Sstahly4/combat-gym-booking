/**
 * Verify Wise Platform webhook signatures (RSA-SHA256 over raw body).
 * @see https://docs.wise.com/guides/developer/webhooks/event-handling
 * @see https://github.com/transferwise/digital-signatures-examples
 */
import { createVerify } from 'node:crypto'

/** Sandbox signing public key (Wise publishes this; safe to embed). */
const WISE_WEBHOOK_PUBLIC_KEY_SANDBOX = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwpb91cEYuyJNQepZAVfP
ZIlPZfNUefH+n+6w9SW3fykqKu938cR7WadQv87oF2VuT+fDt7kqeRziTmPSUhqPU
ys/V2Q1rlfJuXbE+Gga37t7zwd0egQ+KyOEHQOpcTwKmtZ81ieGHynAQzsn1We3j
wt760MsCPJ7GMT141ByQM+yW1Bx+4SG3IGjXWyqOWrcXsxAvIXkpUD/jK/L958Cg
nZEgz0BSEh0QxYLITnW1lLokSx/dTianWPFEhMC9BgijempgNXHNfcVirg1lPSyg
7KqoKUN0oHqWLr2U1A+7kqrl6O2nx3CKs1bj1hToT1+p4kcMoHXA7kA+VBLUpEs
VwIDAQAB
-----END PUBLIC KEY-----`

/** Production signing public key (Wise publishes this; safe to embed). */
const WISE_WEBHOOK_PUBLIC_KEY_LIVE = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvO8vXV+JksBzZAY6GhSO
XdoTCfhXaaiZ+qAbtaDBiu2AGkGVpmEygFmWP4Li9m5+Ni85BhVvZOodM9epgW3F
bA5Q1SexvAF1PPjX4JpMstak/QhAgl1qMSqEevL8cmUeTgcMuVWCJmlge9h7B1CS
D4rtlimGZozG39rUBDg4Qt2K+P4wBfLblL0k4C4YUdLnpGYEDIth+i8XsRpFlogx
CAFyH9+knYsDbR43UJ9shtc42Ybd40Afihj8KnYKXzchyQ42aC8aZ/h5hyZ28yVy
Oj3Vos0VdBIs/gAyJ/4yyQFCXYte64I7ssrlbGRaco4nKF3HmaNhxwyKyJafz19e
HwIDAQAB
-----END PUBLIC KEY-----`

function pickDefaultPublicKeyPem(): string {
  const base = (process.env.WISE_API_BASE || '').toLowerCase()
  if (base.includes('sandbox') || base.includes('wise-sandbox')) {
    return WISE_WEBHOOK_PUBLIC_KEY_SANDBOX
  }
  return WISE_WEBHOOK_PUBLIC_KEY_LIVE
}

/**
 * @param rawBody — exact request body string (must not be re-serialized JSON).
 * @param signatureB64 — value of `X-Signature-SHA256` header (Base64).
 */
export function verifyWiseWebhookSignature(rawBody: string, signatureB64: string | null): boolean {
  if (!signatureB64?.trim()) return false
  const override = process.env.WISE_WEBHOOK_SIGNING_PUBLIC_KEY?.trim()
  const pem = override && override.includes('BEGIN PUBLIC KEY') ? override : pickDefaultPublicKeyPem()
  try {
    const verifier = createVerify('RSA-SHA256')
    verifier.update(rawBody)
    verifier.end()
    return verifier.verify(pem, signatureB64, 'base64')
  } catch {
    return false
  }
}

export function wiseWebhookSignatureBypassAllowed(): boolean {
  return (
    process.env.WISE_WEBHOOK_SKIP_SIGNATURE_VERIFY === '1' &&
    (process.env.NODE_ENV === 'development' || process.env.WISE_ALLOW_INSECURE_WEBHOOK === '1')
  )
}
