/** True while the placeholder owner still needs to set their own password. */
export function isClaimSetupPending(
  profile:
    | {
        placeholder_account?: boolean | null
        claim_password_set?: boolean | null
      }
    | null
    | undefined,
): boolean {
  if (!profile) return false
  return !!profile.placeholder_account || profile.claim_password_set === false
}
