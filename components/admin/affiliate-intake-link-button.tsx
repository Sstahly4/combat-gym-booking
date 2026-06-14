'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CopyReferralLink } from '@/components/admin/copy-referral-link'
import { affiliateInviteLinkAdminNote } from '@/lib/affiliates/program-copy'
import { KeyRound } from 'lucide-react'

type Props = {
  affiliateId: string
  affiliateName: string
  payoutSubmittedAt?: string | null
  setupPending?: boolean
  variant?: 'default' | 'outline'
}

export function AffiliateIntakeLinkButton({
  affiliateId,
  affiliateName,
  payoutSubmittedAt,
  setupPending,
  variant = 'outline',
}: Props) {
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<{
    url: string
    expiresAt: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/intake-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_days: 14 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate link')
      setModal({ url: data.url, expiresAt: data.expires_at })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="space-y-1">
        <Button type="button" variant={variant} size="sm" onClick={generate} disabled={busy}>
          <KeyRound className="mr-1.5 h-4 w-4" />
          {busy ? 'Generating…' : setupPending
            ? 'Generate invite link'
            : payoutSubmittedAt
              ? 'New payout setup link'
              : 'Payout setup link'}
        </Button>
        {payoutSubmittedAt && (
          <p className="text-xs text-stone-500">
            Details submitted{' '}
            {new Date(payoutSubmittedAt).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {setupPending ? 'Invite link' : 'Payout setup link'} — {affiliateName}
            </DialogTitle>
            <DialogDescription>
              {setupPending ? (
                <>
                  Send this private link so they can complete onboarding — name, email, referral code,
                  and payout details.{' '}
                </>
              ) : (
                <>
                  Send this private link so {affiliateName} can enter their own bank or PayPal details.{' '}
                </>
              )}
              {affiliateInviteLinkAdminNote(modal?.expiresAt)}
              {' '}The URL is only shown here — copy it now.
            </DialogDescription>
          </DialogHeader>
          {modal && (
            <div className="mt-2">
              <CopyReferralLink
                url={modal.url}
                label={setupPending ? 'Copy invite link' : 'Copy setup link'}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
