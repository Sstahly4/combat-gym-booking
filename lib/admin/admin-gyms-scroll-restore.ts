/**
 * Preserve scroll position on `/admin/gyms` when admins open the shared gym
 * editor (`/manage/gym/edit`) and return via save/cancel. The Admin Hub main
 * area scrolls inside `AdminLayoutShell`, not `window`.
 */
const MAIN_SCROLL_SELECTOR = '[data-admin-hub-main-scroll]'
const STORAGE_KEY = 'combatstay:admin-gyms-scroll-restore'

function mainScrollEl(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector(MAIN_SCROLL_SELECTOR)
}

/** Snapshot list scroll before navigating to the gym editor from All gyms. */
export function stashAdminGymsListScrollForReturn(): void {
  try {
    const el = mainScrollEl()
    const y = el ? el.scrollTop : window.scrollY
    sessionStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.round(y))))
  } catch {
    // ignore quota / private mode
  }
}

function applyScrollY(y: number): void {
  const el = mainScrollEl()
  if (el) el.scrollTop = y
  else window.scrollTo({ top: y, behavior: 'auto' })
}

/**
 * Restore stashed scroll after `/admin/gyms` finishes loading. Clears storage
 * so normal visits are unaffected.
 */
export function restoreAdminGymsListScrollIfStashed(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw == null) return
    sessionStorage.removeItem(STORAGE_KEY)
    const y = Number.parseFloat(raw)
    if (!Number.isFinite(y) || y < 0) return
    const top = Math.round(y)
    applyScrollY(top)
    requestAnimationFrame(() => applyScrollY(top))
  } catch {
    // ignore
  }
}

/** True when leaving this path for the editor should restore gyms list scroll on return. */
export function shouldStashAdminGymsScrollForPath(pathname: string): boolean {
  return pathname === '/admin/gyms'
}
