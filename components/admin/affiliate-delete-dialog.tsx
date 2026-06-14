'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  affiliateId: string
  affiliateName: string
  referralCode: string | null
  unpaidBalance: number
  alreadyDeleted?: boolean
}

function formatAud(n: number) {
  return `$${n.toFixed(2)} AUD`
}

export function AffiliateDeleteDialog({
  affiliateId,
  affiliateName,
  referralCode,
  unpaidBalance,
  alreadyDeleted,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'confirm' | 'busy'>('confirm')
  const [error, setError] = useState<string | null>(null)

  function close() {
    if (step === 'busy') return
    setOpen(false)
    setStep('confirm')
    setError(null)
  }

  async function confirmDelete() {
    setStep('busy')
    setError(null)
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      setOpen(false)
      router.push('/admin/affiliates')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setStep('confirm')
    }
  }

  if (alreadyDeleted) return null

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
        <Trash2 className="mr-1.5 h-4 w-4" />
        Delete affiliate
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete affiliate?</DialogTitle>
            <DialogDescription>
              This removes {affiliateName} from your active affiliate program. Their referral link will
              stop working immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-stone-600">
            <ul className="list-disc space-y-1 pl-5 text-stone-700">
              {referralCode && (
                <li>
                  Referral link <span className="font-mono">combatstay.com/ref/{referralCode}</span> will
                  redirect to the homepage — no new attributions.
                </li>
              )}
              <li>Referral code retired — historical bookings and payout records stay in your admin.</li>
              <li>Affiliate account marked inactive (soft delete, not a hard wipe).</li>
            </ul>
            {unpaidBalance > 0 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                This affiliate has <strong>{formatAud(unpaidBalance)}</strong> in pending or confirmed
                commissions that have not been paid out yet. Deleting will not pay them automatically —
                settle or note this before you continue.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close} disabled={step === 'busy'}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={step === 'busy'}>
              {step === 'busy' ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
