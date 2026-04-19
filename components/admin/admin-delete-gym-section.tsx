'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Preview = {
  gym: { id: string; name: string; city: string; country: string }
  counts: {
    bookings: number
    packages: number
    images: number
    saved_by_users: number
  }
}

type Step = 1 | 2 | 3

interface AdminDeleteGymSectionProps {
  gymId: string
  gymName: string
}

export function AdminDeleteGymSection({ gymId, gymName }: AdminDeleteGymSectionProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [nameInput, setNameInput] = useState('')
  const [deletePhrase, setDeletePhrase] = useState('')
  const [ackIrreversible, setAckIrreversible] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const res = await fetch(`/api/admin/gyms/${encodeURIComponent(gymId)}/delete-preview`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load')
      setPreview(data as Preview)
      setStep(2)
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : 'Failed to load impact summary')
    } finally {
      setPreviewLoading(false)
    }
  }, [gymId])

  const goToConfirm = () => {
    setSubmitError(null)
    setStep(3)
  }

  const resetFlow = () => {
    setStep(1)
    setPreview(null)
    setPreviewError(null)
    setNameInput('')
    setDeletePhrase('')
    setAckIrreversible(false)
    setSubmitError(null)
  }

  const nameMatches = nameInput.trim() === gymName.trim()
  const phraseOk = deletePhrase.trim() === 'DELETE'
  const canSubmit = nameMatches && phraseOk && ackIrreversible && !submitting

  const handleDelete = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/admin/gyms/${encodeURIComponent(gymId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm_gym_name: nameInput.trim(),
          confirm_phrase: deletePhrase.trim(),
          acknowledge_irreversible: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data?.error || 'Delete failed')
        return
      }
      router.replace('/admin/gyms')
      router.refresh()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mt-10 border-rose-200 bg-rose-50/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-lg text-rose-950">Admin: remove this gym</CardTitle>
            <CardDescription className="text-rose-900/80">
              Permanent removal from the platform. Use for policy violations, duplicate listings, or cleaning up
              test data. This is not available to gym owners — admins only.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-rose-900/90">
              You will see a summary of linked bookings and content, then type the gym name and the word DELETE to
              confirm. This cannot be undone.
            </p>
            {previewError ? (
              <p className="text-sm text-rose-700" role="alert">
                {previewError}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="border-rose-300 bg-white text-rose-900 hover:bg-rose-100"
              onClick={() => void loadPreview()}
              disabled={previewLoading}
            >
              {previewLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </>
              ) : (
                'Step 1 — Show impact summary'
              )}
            </Button>
          </div>
        )}

        {step === 2 && preview && (
          <div className="space-y-4">
            <div className="rounded-lg border border-rose-200 bg-white/90 px-4 py-3 text-sm text-stone-800">
              <p className="font-semibold text-stone-900">
                {preview.gym.name}
                <span className="font-normal text-stone-600">
                  {' '}
                  — {preview.gym.city}, {preview.gym.country}
                </span>
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
                <li>
                  <strong>{preview.counts.bookings}</strong> booking record(s) (will be removed with the gym)
                </li>
                <li>
                  <strong>{preview.counts.packages}</strong> package(s)
                </li>
                <li>
                  <strong>{preview.counts.images}</strong> gallery image row(s)
                </li>
                <li>
                  <strong>{preview.counts.saved_by_users}</strong> saved-list entry / entries for guests
                </li>
              </ul>
              <p className="mt-3 text-xs text-stone-600">
                Database rows that reference this gym are removed per foreign-key rules (including bookings and
                related data). Stripe and storage files may need separate cleanup in edge cases.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={resetFlow}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-rose-700 text-white hover:bg-rose-800"
                onClick={goToConfirm}
              >
                Step 2 — I understand, continue to typed confirmation
              </Button>
            </div>
          </div>
        )}

        {step === 3 && preview && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-rose-950">Final confirmation</p>
            <div className="space-y-2">
              <Label htmlFor="admin-del-name">Type the gym name exactly</Label>
              <Input
                id="admin-del-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={gymName}
                autoComplete="off"
                className="border-stone-300 bg-white"
              />
              {nameInput.length > 0 && !nameMatches ? (
                <p className="text-xs text-rose-700">Must match exactly (including spaces).</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-del-phrase">Type DELETE in capitals</Label>
              <Input
                id="admin-del-phrase"
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="border-stone-300 bg-white"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-800">
              <input
                type="checkbox"
                checked={ackIrreversible}
                onChange={(e) => setAckIrreversible(e.target.checked)}
                className="mt-1 rounded border-stone-400"
              />
              <span>I understand this permanently removes this gym and related records from the platform.</span>
            </label>
            {submitError ? (
              <p className="text-sm text-rose-700" role="alert">
                {submitError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={submitting}>
                Back
              </Button>
              <Button
                type="button"
                className="bg-rose-800 text-white hover:bg-rose-900"
                disabled={!canSubmit}
                onClick={() => void handleDelete()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing…
                  </>
                ) : (
                  'Step 3 — Permanently delete gym'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
