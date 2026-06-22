/** Gyms shown on public listings (homepage, search, guides). */
export const PUBLIC_GYM_VERIFICATION_STATUSES = ['verified', 'trusted'] as const

export type PublicGymVerificationStatus = (typeof PUBLIC_GYM_VERIFICATION_STATUSES)[number]

export function isPublicGymListing(status: string | null | undefined): boolean {
  return PUBLIC_GYM_VERIFICATION_STATUSES.includes(status as PublicGymVerificationStatus)
}
