'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Gym } from '@/lib/types/database'

interface GymVerificationCardProps {
  gym: Gym
  onVerify: (gymId: string) => Promise<void>
  isVerifying: boolean
}

export function GymVerificationCard({ gym, onVerify, isVerifying }: GymVerificationCardProps) {
  const [stripeStatus, setStripeStatus] = useState<{
    verified: boolean
    has_account: boolean
    details: any
  } | null>(null)
  const [loadingStripe, setLoadingStripe] = useState(true)

  useEffect(() => {
    checkStripeStatus()
  }, [gym.id])

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

  const requirements = {
    googleMaps: !!gym.google_maps_link,
    socialMedia: !!(gym.instagram_link || gym.facebook_link),
    stripeConnect: stripeStatus?.verified || false,
  }

  const allMet = requirements.googleMaps && requirements.socialMedia && requirements.stripeConnect

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{gym.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {gym.city}, {gym.country}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            Draft
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Requirements Checklist */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">Verification Requirements:</div>
          
          {/* Google Maps */}
          <div className="flex items-start gap-3">
            {requirements.googleMaps ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Google Maps Listing</div>
              <div className="text-xs text-gray-600">
                {requirements.googleMaps ? (
                  <a href={gym.google_maps_link!} target="_blank" rel="noopener noreferrer" className="text-[#003580] hover:underline inline-flex items-center gap-1">
                    View listing <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  'Missing Google Maps link'
                )}
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex items-start gap-3">
            {requirements.socialMedia ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Instagram or Facebook</div>
              <div className="text-xs text-gray-600">
                {requirements.socialMedia ? (
                  <div className="flex gap-2">
                    {gym.instagram_link && (
                      <a href={gym.instagram_link} target="_blank" rel="noopener noreferrer" className="text-[#003580] hover:underline inline-flex items-center gap-1">
                        Instagram <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {gym.facebook_link && (
                      <a href={gym.facebook_link} target="_blank" rel="noopener noreferrer" className="text-[#003580] hover:underline inline-flex items-center gap-1">
                        Facebook <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  'Missing Instagram or Facebook link'
                )}
              </div>
            </div>
          </div>

          {/* Stripe Connect */}
          <div className="flex items-start gap-3">
            {loadingStripe ? (
              <Loader2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5 animate-spin" />
            ) : requirements.stripeConnect ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Stripe Connect (KYC + Bank Account)</div>
              <div className="text-xs text-gray-600">
                {loadingStripe ? (
                  'Checking status...'
                ) : requirements.stripeConnect ? (
                  'Fully verified and ready to receive payments'
                ) : stripeStatus?.has_account ? (
                  'Account created but not fully verified. Complete KYC and add bank account.'
                ) : (
                  'Stripe Connect not set up'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {!allMet && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ Missing Requirements</p>
            <p className="text-xs text-yellow-700">
              Missing: {
                !requirements.googleMaps ? 'Google Maps, ' : ''
              }{
                !requirements.socialMedia ? 'Social Media, ' : ''
              }{
                !requirements.stripeConnect ? 'Stripe Connect' : ''
              }
            </p>
            <p className="text-xs text-yellow-700 mt-1 font-medium">
              As admin, you can verify anyway (manual override)
            </p>
          </div>
        )}

        {allMet && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">✓ All requirements met</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(`/manage/gym/edit?id=${gym.id}`, '_blank')}
          >
            Edit Gym
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => {
              if (!allMet) {
                if (confirm('This gym is missing some requirements. Verify anyway? (Admin override)')) {
                  onVerify(gym.id)
                }
              } else {
                onVerify(gym.id)
              }
            }}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Gym'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
