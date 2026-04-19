/**
 * Owner gym onboarding: routes where we should not offer shortcuts that skip setup
 * (navbar Dashboard link, header dashboard search, etc.).
 *
 * `/manage/onboarding/complete` is excluded — owners have finished the wizard and
 * should be able to reach the dashboard normally.
 */
export function isManageGymOnboardingNavLocked(pathname: string | null | undefined): boolean {
  if (!pathname) return false

  if (pathname === '/manage/onboarding/complete' || pathname.startsWith('/manage/onboarding/complete/')) {
    return false
  }

  if (
    pathname === '/manage/onboarding' ||
    pathname.startsWith('/manage/onboarding/') ||
    pathname === '/manage/security-onboarding' ||
    pathname.startsWith('/manage/security-onboarding/') ||
    pathname === '/manage/list-your-gym' ||
    pathname.startsWith('/manage/list-your-gym/') ||
    pathname.startsWith('/manage/invite/')
  ) {
    return true
  }

  return false
}
