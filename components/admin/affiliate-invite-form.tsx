'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CopyReferralLink } from '@/components/admin/copy-referral-link'
import { affiliateInviteLinkAdminNote, tierDisplayName } from '@/lib/affiliates/program-copy'
import type { AffiliateTier } from '@/lib/types/database'
import { Link2 } from 'lucide-react'

export function AffiliateInviteForm() {
  const [tier, setTier] = useState<AffiliateTier>('founding')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  async function generate() {
    setBusy(true)
    setError(null)
    setInviteUrl(null)
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate invite')
      if (!data.invite_link?.url) throw new Error('No invite link returned')
      setInviteUrl(data.invite_link.url)
      setExpiresAt(data.invite_link.expires_at || null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {inviteUrl && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">Invite link ready</p>
          <p className="mt-1 text-xs text-blue-800">
            Send this privately. They&apos;ll choose their referral code, enter payout details, and
            receive their share link — nothing for you to type in.
            {affiliateInviteLinkAdminNote(expiresAt)}
          </p>
          <div className="mt-3">
            <CopyReferralLink url={inviteUrl} label="Copy invite link" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tier">Commission tier</Label>
        <Select
          id="tier"
          value={tier}
          onChange={(e) => setTier(e.target.value as AffiliateTier)}
        >
          <option value="founding">Founding Partner — 40% of CombatStay commission</option>
          <option value="standard">Standard — 30% of CombatStay commission</option>
        </Select>
        <p className="text-xs text-stone-500">
          They&apos;ll see {tierDisplayName(tier)} details when they open the link.
        </p>
      </div>

      <Button type="button" onClick={generate} disabled={busy} className="w-full sm:w-auto">
        <Link2 className="mr-1.5 h-4 w-4" />
        {busy ? 'Generating…' : 'Generate invite link'}
      </Button>
    </div>
  )
}
