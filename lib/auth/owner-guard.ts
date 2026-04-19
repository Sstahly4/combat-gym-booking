import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'

export type OwnerAccessStatus = 'ok' | 'no_user' | 'no_profile' | 'not_owner'

interface OwnerGuardResult {
  status: 'ok' | 'no_user' | 'no_profile' | 'not_owner'
  userId: string
  profile: Profile | null
}

export interface OwnerAccessContext {
  status: OwnerAccessStatus
  userId: string
  user: any | null
  profile: Profile | null
  supabase: any
}

export async function getOwnerAccessContext(): Promise<OwnerAccessContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'no_user', userId: '', user: null, profile: null, supabase }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { status: 'no_profile', userId: user.id, user, profile: null, supabase }
  }

  if (profile.role !== 'owner') {
    return { status: 'not_owner', userId: user.id, user, profile: profile as Profile, supabase }
  }

  return {
    status: 'ok',
    userId: user.id,
    user,
    profile: profile as Profile,
    supabase,
  }
}

/**
 * Owner **or** platform admin — used by the partner onboarding wizard and related
 * APIs so admins can pre-create gyms (same templates/steps) under their account,
 * then verify from the Admin Hub.
 */
export async function getOwnerOrAdminAccessContext(): Promise<OwnerAccessContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'no_user', userId: '', user: null, profile: null, supabase }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { status: 'no_profile', userId: user.id, user, profile: null, supabase }
  }

  const role = profile.role as string
  if (role !== 'owner' && role !== 'admin') {
    return { status: 'not_owner', userId: user.id, user, profile: profile as Profile, supabase }
  }

  return {
    status: 'ok',
    userId: user.id,
    user,
    profile: profile as Profile,
    supabase,
  }
}

export async function requireOwnerAccess(): Promise<OwnerGuardResult> {
  const context = await getOwnerAccessContext()
  return {
    status: context.status,
    userId: context.userId,
    profile: context.profile,
  }
}
