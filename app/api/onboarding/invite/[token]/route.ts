export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getInviteByToken(token: string) {
  const supabase = await createClient()
  return supabase
    .from('owner_invite_tokens')
    .select('id, email, expires_at, used_at')
    .eq('token', token)
    .maybeSingle()
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: invite } = await getInviteByToken(params.token)
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  const expired = new Date(invite.expires_at).getTime() <= Date.now()
  const emailMismatch = invite.email.toLowerCase() !== user.email.toLowerCase()
  const invalid = expired || Boolean(invite.used_at) || emailMismatch

  return NextResponse.json({
    valid: !invalid,
    expired,
    used: Boolean(invite.used_at),
    emailMismatch,
    email: invite.email,
  })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: invite } = await getInviteByToken(params.token)
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  const expired = new Date(invite.expires_at).getTime() <= Date.now()
  if (expired || invite.used_at) {
    return NextResponse.json({ error: 'Invite is no longer valid' }, { status: 400 })
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Invite email does not match current user' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'owner', updated_at: now })
    .eq('id', user.id)

  if (roleError) {
    return NextResponse.json({ error: 'Failed to assign owner role' }, { status: 500 })
  }

  const { error: inviteError } = await supabase
    .from('owner_invite_tokens')
    .update({ used_at: now, used_by: user.id })
    .eq('id', invite.id)
    .is('used_at', null)

  if (inviteError) {
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
