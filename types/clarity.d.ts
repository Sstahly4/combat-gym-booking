export {}

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
  }
}
