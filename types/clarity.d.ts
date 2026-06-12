export {}

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void
  }
}
