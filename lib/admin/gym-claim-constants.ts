/**
 * Synthetic Supabase Auth email domain for placeholder gym-owner accounts.
 * Not a mailbox — claim links are sent to the real owner out-of-band.
 * `.local` is reserved (RFC 6762) so it will not collide with real inboxes.
 *
 * On rebrand: change this string and run a one-time migration to update
 * existing auth.users.email + profiles.placeholder_email for any unclaimed
 * placeholders still on the old domain.
 */
export const PLACEHOLDER_EMAIL_DOMAIN = 'claim.combatbooking.local'
