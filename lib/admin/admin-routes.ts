/**
 * Admin → partner onboarding wizard. Admins use the same steps/templates as
 * owners; the draft gym is created under the admin account until a claim link
 * or handoff changes ownership.
 */
export const ADMIN_CREATE_GYM_ONBOARDING_HREF = '/admin/create-gym?step=step-1&create_new=1'

/**
 * Append a fresh `t=<timestamp>` to the admin create-gym URL so that re-clicking
 * "Create gym" (when the wizard is already mounted on the same route) re-runs
 * the loader and starts a brand new draft session instead of resuming the
 * previous in-memory state.
 */
export function buildFreshAdminCreateGymHref(): string {
  const sep = ADMIN_CREATE_GYM_ONBOARDING_HREF.includes('?') ? '&' : '?'
  return `${ADMIN_CREATE_GYM_ONBOARDING_HREF}${sep}t=${Date.now()}`
}
