import type { Profile } from '@/lib/types/database'

const GUEST_DETAILS_PREFIX = 'guest_details_'
const GUEST_FLOW_PREFIX = 'booking_session_'
const TTL_MS = 30 * 60 * 1000

export interface GuestDetailsFields {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  notes: string
  discipline: string
}

interface StoredGuestDetails extends GuestDetailsFields {
  writtenAt: number
}

export interface GuestFlowFields {
  checkin: string
  checkout: string
  guestCount: number
  bookingFor: 'self' | 'other'
}

interface StoredGuestFlow extends GuestFlowFields {
  writtenAt: number
}

export interface ProfileDetailsFields {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
}

/** Map signed-in profile + auth email to Your details form fields. */
export function detailsFromProfile(
  profile: Profile,
  email?: string | null
): ProfileDetailsFields {
  const firstName =
    profile.legal_first_name?.trim() ||
    profile.full_name?.trim().split(/\s+/)[0] ||
    ''
  const lastName =
    profile.legal_last_name?.trim() ||
    profile.full_name?.trim().split(/\s+/).slice(1).join(' ') ||
    ''
  return {
    firstName,
    lastName,
    email: email?.trim() || '',
    phone: profile.account_holder_phone?.trim() || '',
    country: profile.country_of_residence?.trim() || 'Australia',
  }
}

export function writeGuestDetails(gymId: string, fields: GuestDetailsFields): void {
  try {
    const payload: StoredGuestDetails = { ...fields, writtenAt: Date.now() }
    sessionStorage.setItem(`${GUEST_DETAILS_PREFIX}${gymId}`, JSON.stringify(payload))
  } catch {}
}

export function readGuestDetails(gymId: string): GuestDetailsFields | null {
  try {
    const raw = sessionStorage.getItem(`${GUEST_DETAILS_PREFIX}${gymId}`)
    if (raw) {
      const data: StoredGuestDetails = JSON.parse(raw)
      if (Date.now() - data.writtenAt > TTL_MS) {
        clearGuestDetails(gymId)
        return null
      }
      return {
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        country: data.country ?? 'Australia',
        notes: data.notes ?? '',
        discipline: data.discipline ?? '',
      }
    }
    // Legacy: personal fields lived in booking_session before guest_details split.
    const legacyRaw = sessionStorage.getItem(`${GUEST_FLOW_PREFIX}${gymId}`)
    if (!legacyRaw) return null
    const legacy = JSON.parse(legacyRaw) as Record<string, unknown>
    if (
      typeof legacy.writtenAt === 'number' &&
      Date.now() - legacy.writtenAt > TTL_MS
    ) {
      return null
    }
    const hasPersonal =
      legacy.firstName || legacy.lastName || legacy.email || legacy.phone
    if (!hasPersonal) return null
    return {
      firstName: String(legacy.firstName ?? ''),
      lastName: String(legacy.lastName ?? ''),
      email: String(legacy.email ?? ''),
      phone: String(legacy.phone ?? ''),
      country: String(legacy.country ?? 'Australia'),
      notes: String(legacy.notes ?? ''),
      discipline: String(legacy.discipline ?? ''),
    }
  } catch {
    return null
  }
}

export function clearGuestDetails(gymId: string): void {
  try {
    sessionStorage.removeItem(`${GUEST_DETAILS_PREFIX}${gymId}`)
  } catch {}
}

export function clearGuestDetailsIfForeignGym(gymId: string): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (!key?.startsWith(GUEST_DETAILS_PREFIX)) continue
      const storedGymId = key.slice(GUEST_DETAILS_PREFIX.length)
      if (storedGymId !== gymId) keysToRemove.push(key)
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k))
  } catch {}
}

export function writeGuestFlowSession(gymId: string, fields: GuestFlowFields): void {
  try {
    const payload: StoredGuestFlow = { ...fields, writtenAt: Date.now() }
    sessionStorage.setItem(`${GUEST_FLOW_PREFIX}${gymId}`, JSON.stringify(payload))
  } catch {}
}

export function readGuestFlowSession(gymId: string): GuestFlowFields | null {
  try {
    const raw = sessionStorage.getItem(`${GUEST_FLOW_PREFIX}${gymId}`)
    if (!raw) return null
    const data = JSON.parse(raw) as StoredGuestFlow & Record<string, unknown>
    if (Date.now() - (data.writtenAt ?? 0) > TTL_MS) {
      clearGuestFlowSession(gymId)
      return null
    }
    return {
      checkin: String(data.checkin ?? ''),
      checkout: String(data.checkout ?? ''),
      guestCount: typeof data.guestCount === 'number' ? data.guestCount : 1,
      bookingFor: data.bookingFor === 'other' ? 'other' : 'self',
    }
  } catch {
    return null
  }
}

export function clearGuestFlowSession(gymId: string): void {
  try {
    sessionStorage.removeItem(`${GUEST_FLOW_PREFIX}${gymId}`)
  } catch {}
}

export function clearGuestCheckoutSession(gymId: string): void {
  clearGuestDetails(gymId)
  clearGuestFlowSession(gymId)
}
