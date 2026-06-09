import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { findAuthUserByEmail } from '@/lib/auth/find-auth-user-by-email'
import { sendFinishSetupAccountEmail } from '@/lib/email'
import { CHECKOUT_GUEST_ONBOARDING_ENTRY } from '@/lib/auth/onboarding-entries'

export type ProvisionGuestAccountResult =
  | { status: 'skipped'; reason: string }
  | { status: 'linked_existing'; userId: string }
  | { status: 'invited'; userId: string }

function extractActionLink(linkData: { properties?: Record<string, unknown> | null } | null): string | null {
  const actionLink = linkData?.properties?.action_link
  return typeof actionLink === 'string' && actionLink.length > 0 ? actionLink : null
}

async function ensureFighterProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  params: { fullName: string | null; phone: string | null }
) {
  const { data: existing } = await admin
    .from('profiles')
    .select('role, full_name, account_holder_phone')
    .eq('id', userId)
    .maybeSingle()

  await admin.from('profiles').upsert(
    {
      id: userId,
      role: existing?.role === 'owner' || existing?.role === 'admin' ? existing.role : 'fighter',
      full_name: existing?.full_name || params.fullName,
      account_holder_phone: existing?.account_holder_phone || params.phone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
}

async function linkBookingToUser(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
  userId: string
) {
  await admin
    .from('bookings')
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .is('user_id', null)
}

/**
 * After guest checkout payment is authorized, create a fighter account (or link
 * an existing one) and email a password-setup link for new users.
 */
export async function provisionGuestAccountFromBooking(params: {
  bookingId: string
  appOrigin: string
}): Promise<ProvisionGuestAccountResult> {
  const admin = createAdminClient()

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, user_id, guest_email, guest_name, guest_phone, booking_reference')
    .eq('id', params.bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    return { status: 'skipped', reason: 'booking_not_found' }
  }

  if (booking.user_id) {
    return { status: 'skipped', reason: 'already_linked' }
  }

  const guestEmail = (booking.guest_email || '').toLowerCase().trim()
  if (!guestEmail) {
    return { status: 'skipped', reason: 'no_guest_email' }
  }

  const guestName = (booking.guest_name || '').trim() || 'Guest'
  const guestPhone = (booking.guest_phone || '').trim() || null

  const finishSetupPath = `/auth/finish-setup?booking=${params.bookingId}`
  const redirectTo = `${params.appOrigin}/auth/callback?redirect=${encodeURIComponent(finishSetupPath)}`

  let userId: string | null = null
  let inviteLink: string | null = null

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: guestEmail,
    options: {
      redirectTo,
      data: {
        full_name: guestName,
        role_intent: 'fighter',
        onboarding_entry: CHECKOUT_GUEST_ONBOARDING_ENTRY,
        checkout_booking_id: params.bookingId,
      },
    },
  })

  if (!linkError && linkData?.user?.id) {
    userId = linkData.user.id
    inviteLink = extractActionLink(linkData as { properties?: Record<string, unknown> | null })
  } else {
    const alreadyRegistered =
      linkError?.message?.toLowerCase().includes('already') ||
      linkError?.message?.toLowerCase().includes('registered')

    if (!alreadyRegistered) {
      console.error('[provision-guest-account] invite link failed', linkError)
      return { status: 'skipped', reason: 'invite_failed' }
    }

    const existing = await findAuthUserByEmail(admin, guestEmail)
    if (!existing?.id) {
      return { status: 'skipped', reason: 'existing_user_not_found' }
    }

    userId = existing.id
    await linkBookingToUser(admin, params.bookingId, userId)
    await ensureFighterProfile(admin, userId, { fullName: guestName, phone: guestPhone })
    return { status: 'linked_existing', userId }
  }

  if (!userId) {
    return { status: 'skipped', reason: 'no_user_id' }
  }

  await linkBookingToUser(admin, params.bookingId, userId)
  await ensureFighterProfile(admin, userId, { fullName: guestName, phone: guestPhone })

  if (inviteLink) {
    try {
      await sendFinishSetupAccountEmail({
        guestName,
        guestEmail,
        setupLink: inviteLink,
        bookingReference: booking.booking_reference || params.bookingId,
      })
    } catch (emailErr) {
      console.error('[provision-guest-account] finish-setup email failed (non-fatal)', emailErr)
    }
  }

  return { status: 'invited', userId }
}
