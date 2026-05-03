'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, ExternalLink, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Gym } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface VerificationChecklistProps {
  gym: Gym
}

type Step = {
  id: string
  title: string
  description: string
  done: boolean
  loading?: boolean
  actionLabel: string
  href?: string
  externalHref?: string
}

export function VerificationChecklist({ gym }: VerificationChecklistProps) {
  const [stripeStatus, setStripeStatus] = useState<{
    verified: boolean
    has_account: boolean
    details: unknown
  } | null>(null)
  const [loadingStripe, setLoadingStripe] = useState(true)

  const payoutRail = (gym.payout_rail as 'wise' | 'stripe_connect' | undefined) ?? 'wise'

  useEffect(() => {
    if (payoutRail !== 'stripe_connect') {
      setStripeStatus(null)
      setLoadingStripe(false)
      return
    }
    const checkStripeStatus = async () => {
      try {
        const response = await fetch(`/api/gyms/${gym.id}/check-stripe-status`)
        const data = await response.json()
        setStripeStatus(data)
      } catch (error) {
        console.error('Error checking Stripe status:', error)
      } finally {
        setLoadingStripe(false)
      }
    }
    void checkStripeStatus()
  }, [gym.id, payoutRail])

  const wisePayoutOk = Boolean(gym.wise_payout_ready && gym.wise_recipient_id)
  const stripePayoutOk = Boolean(stripeStatus?.verified)

  const requirements = useMemo(
    () => ({
      googleMaps: !!gym.google_maps_link,
      socialMedia: !!(gym.instagram_link || gym.facebook_link),
      payouts:
        payoutRail === 'stripe_connect' ? stripePayoutOk : wisePayoutOk,
      adminApproved: gym.admin_approved || false,
    }),
    [
      gym.google_maps_link,
      gym.instagram_link,
      gym.facebook_link,
      gym.admin_approved,
      payoutRail,
      stripePayoutOk,
      wisePayoutOk,
    ]
  )

  const verificationStatus = gym.verification_status
  const completedCount = Object.values(requirements).filter(Boolean).length
  const totalSteps = 4
  const progressPct = Math.round((completedCount / totalSteps) * 100)

  const steps: Step[] = useMemo(
    () => [
      {
        id: 'maps',
        title: 'Google Maps link',
        description: requirements.googleMaps
          ? 'Your location link is on file.'
          : 'Add a public Google Maps URL so travelers can find you.',
        done: requirements.googleMaps,
        actionLabel: requirements.googleMaps ? 'View map' : 'Add in Edit gym',
        externalHref: requirements.googleMaps ? gym.google_maps_link! : undefined,
        href: !requirements.googleMaps ? `/manage/gym/edit?id=${gym.id}&section=basic` : undefined,
      },
      {
        id: 'social',
        title: 'Instagram or Facebook',
        description: requirements.socialMedia
          ? 'At least one social profile is linked.'
          : 'Link Instagram or Facebook so we can verify your gym’s presence.',
        done: requirements.socialMedia,
        actionLabel: requirements.socialMedia ? 'Open profile' : 'Add in Edit gym',
        externalHref:
          gym.instagram_link || gym.facebook_link
            ? gym.instagram_link || gym.facebook_link || undefined
            : undefined,
        href: !requirements.socialMedia ? `/manage/gym/edit?id=${gym.id}&section=basic` : undefined,
      },
      {
        id: 'payouts',
        title: payoutRail === 'stripe_connect' ? 'Payout account' : 'Payout details',
        description:
          payoutRail === 'stripe_connect'
            ? loadingStripe
              ? 'Checking payout account…'
              : requirements.payouts
                ? 'Your payout account is ready.'
                : stripeStatus?.has_account
                  ? 'Finish identity and bank details for your connected account.'
                  : 'Connect a payout account to receive earnings from bookings.'
            : requirements.payouts
              ? 'Bank transfer recipient is on file.'
              : 'Add recipient details under Balances → Payouts.',
        done: requirements.payouts,
        loading: payoutRail === 'stripe_connect' ? loadingStripe : false,
        actionLabel:
          payoutRail === 'stripe_connect'
            ? requirements.payouts
              ? 'Open payouts'
              : 'Finish setup'
            : requirements.payouts
              ? 'Open payouts'
              : 'Add payout details',
        href: `/manage/balances/payouts?gym_id=${encodeURIComponent(gym.id)}`,
      },
      {
        id: 'admin',
        title: 'Platform approval',
        description: requirements.adminApproved
          ? 'Your gym has been approved to appear in search.'
          : 'After the steps above, our team reviews your listing. No action needed unless we contact you.',
        done: requirements.adminApproved,
        actionLabel: 'Learn more',
        href: '/manage/help',
      },
    ],
    [
      gym.id,
      gym.google_maps_link,
      gym.instagram_link,
      gym.facebook_link,
      loadingStripe,
      requirements,
      stripeStatus?.has_account,
      payoutRail,
    ]
  )

  const statusBadge = () => {
    if (verificationStatus === 'verified') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/80">
          Live
        </span>
      )
    }
    if (verificationStatus === 'trusted') {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
          Trusted
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
        In progress
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Get your gym verified</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                Complete each step below. You’ll see progress here until your listing is live.
              </CardDescription>
            </div>
            {statusBadge()}
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-600">
              <span>
                Progress: {completedCount} of {totalSteps}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#003580] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex gap-4 rounded-lg border p-4 transition-colors',
                step.done ? 'border-emerald-200/80 bg-emerald-50/30' : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-gray-700">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
                ) : step.loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" aria-hidden />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                <div className="mt-3">
                  {step.loading ? (
                    <span className="text-sm text-gray-400">Checking…</span>
                  ) : step.externalHref ? (
                    <a
                      href={step.externalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#003580] hover:underline"
                    >
                      {step.actionLabel}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : step.href ? (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#003580] hover:underline"
                    >
                      {step.actionLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {verificationStatus === 'draft' && (
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">
            {completedCount === totalSteps ? 'Ready for review' : 'Still in draft'}
          </p>
          <p className="mt-1 text-gray-600">
            {completedCount === totalSteps
              ? 'All checklist items are done. We’ll review and approve your gym for search when ready.'
              : 'Finish the numbered steps above. Use Edit gym and Payouts where linked.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-gray-300 bg-white">
              <Link href={`/manage/gym/edit?id=${gym.id}`}>Edit gym profile</Link>
            </Button>
            {payoutRail === 'stripe_connect' && !gym.stripe_account_id ? (
              <Button asChild className="bg-[#003580] hover:bg-[#002a66]">
                <Link href={`/manage/balances/payouts?gym_id=${encodeURIComponent(gym.id)}`}>Payouts</Link>
              </Button>
            ) : payoutRail === 'wise' && !wisePayoutOk ? (
              <Button asChild className="bg-[#003580] hover:bg-[#002a66]">
                <Link href={`/manage/balances/payouts?gym_id=${encodeURIComponent(gym.id)}`}>Payouts</Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {verificationStatus === 'verified' && (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-4 text-sm text-emerald-950">
          <p className="font-medium">Your gym is live in search</p>
          <p className="mt-1 text-emerald-900/90">Travelers can discover and book your packages.</p>
        </div>
      )}

      {verificationStatus === 'trusted' && (
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm text-gray-800">
          <p className="font-medium text-gray-900">Trusted gym</p>
          <p className="mt-1 text-gray-600">Strong history of completed bookings and ratings.</p>
        </div>
      )}
    </div>
  )
}
