import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const roleIntent = user.user_metadata?.role_intent
      const onboardingEntry = user.user_metadata?.onboarding_entry
      const expiresAtRaw = user.user_metadata?.onboarding_link_expires_at
      const expiresAtMs =
        typeof expiresAtRaw === 'string' ? new Date(expiresAtRaw).getTime() : Number.NaN
      const isSelfServeExpired =
        onboardingEntry === 'self_serve' &&
        Number.isFinite(expiresAtMs) &&
        Date.now() > expiresAtMs

      if (isSelfServeExpired) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/manage/list-your-gym?error=verification_link_expired', requestUrl.origin)
        )
      }

      if (roleIntent === 'owner') {
        await supabase
          .from('profiles')
          .update({
            role: 'owner',
            full_name: user.user_metadata?.full_name || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }

      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'oauth_sign_in',
        metadata: { source: 'auth_callback' },
      })
    }
  }

  return NextResponse.redirect(new URL(redirect, requestUrl.origin))
}
