import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ClaimLinkOpenerKind = 'admin' | 'owner'

/**
 * Who clicked /claim/<token> — read the browser session *before* we swap cookies
 * to the placeholder owner. An admin testing the link while logged into the hub
 * is recorded as admin; everyone else (including logged-out gym owners) as owner.
 */
export async function detectClaimLinkOpenerKind(
  request: NextRequest,
  adminDb: SupabaseClient,
): Promise<ClaimLinkOpenerKind> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          /* read-only: do not mutate cookies during detection */
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user?.id) return 'owner'

  const { data: profile } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return profile?.role === 'admin' ? 'admin' : 'owner'
}
