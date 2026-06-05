/**
 * EN / TH copy for the Stripe payout onboarding pre-drawer gate.
 * Keyed by BCP-47 language code — add languages here as needed.
 */

export type PayoutGateCopy = {
  gateTitle: string
  gateBody: string
  appStoreLabel: string
  playStoreLabel: string
  checkboxLabel: string
}

const EN: PayoutGateCopy = {
  gateTitle: 'Before you start — install Google Authenticator',
  gateBody:
    'Stripe will ask you to scan a QR code with this free app to secure your payout account. It takes about 5 minutes and is a one-time setup.',
  appStoreLabel: 'App Store (iPhone)',
  playStoreLabel: 'Play Store (Android)',
  checkboxLabel: 'I have Google Authenticator installed on my phone',
}

const TH: PayoutGateCopy = {
  gateTitle: 'ก่อนเริ่ม — ติดตั้ง Google Authenticator',
  gateBody:
    'Stripe จะให้สแกน QR code ด้วยแอปฟรีนี้เพื่อรักษาความปลอดภัยบัญชีรับเงินของคุณ ใช้เวลาประมาณ 5 นาที และทำครั้งเดียว',
  appStoreLabel: 'App Store (iPhone)',
  playStoreLabel: 'Play Store (Android)',
  checkboxLabel: 'ฉันติดตั้ง Google Authenticator บนมือถือแล้ว',
}

export const APP_STORE_URL =
  'https://apps.apple.com/app/google-authenticator/id388497605'
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2'

export function getPayoutGateCopy(preferredLanguage: string | null | undefined): PayoutGateCopy {
  if (preferredLanguage === 'th-TH') return TH
  return EN
}
