import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API route to update profile role after signup
 * This is more reliable than client-side upsert because:
 * 1. It can use admin client if needed
 * 2. It handles race conditions better
 * 3. It's server-side, so RLS is more predictable
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role, full_name } = body

    if (!role || !['fighter', 'owner', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Try with regular client first (respects RLS)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role,
        full_name: full_name || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    // If update fails, try insert (profile might not exist yet due to trigger timing)
    if (updateError) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          role,
          full_name: full_name || null,
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Profile update/insert error:', insertError)
        // If both fail, try with admin client as last resort (bypasses RLS)
        const adminSupabase = createAdminClient()
        const { error: adminError } = await adminSupabase
          .from('profiles')
          .upsert({
            id: user.id,
            role,
            full_name: full_name || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (adminError) {
          return NextResponse.json(
            { error: 'Failed to update profile', details: adminError.message },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
