'use client'

/**
 * Recover from missing `profiles` rows (legacy signups / rare races).
 * New users normally get a profile from signup or OAuth callbacks — we never surface a “pick role” page.
 */

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/** Align with signup/oauth: explicit partner intent in user metadata ⇒ owner row. */
export function inferProfileRoleFromUser(user: User): 'fighter' | 'owner' {
  return user.user_metadata?.role_intent === 'owner' ? 'owner' : 'fighter'
}

export async function upsertMinimalProfileForUser(
  userId: string,
  role: 'fighter' | 'owner'
): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  return !error
}
