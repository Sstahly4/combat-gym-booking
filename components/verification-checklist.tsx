'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Gym } from '@/lib/types/database'

interface VerificationChecklistProps {
  gym: Gym
}

export function VerificationChecklist({ gym }: VerificationChecklistProps) {
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
    adminApproved: gym.admin_approved || false,
  }

  const allMet = Object.values(requirements).every(v => v === true)
  const verificationStatus = gym.verification_status

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Verification Status</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
            verificationStatus === 'trusted' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {verificationStatus === 'verified' ? '✓ Verified' :
             verificationStatus === 'trusted' ? '⭐ Trusted' :
             'Draft'}
          </span>
        </CardTitle>
        <CardDescription>
          {verificationStatus === 'draft' 
            ? 'Complete all requirements to make your gym visible and bookable'
            : verificationStatus === 'verified'
            ? 'Your gym is live and bookable!'
            : 'Your gym has proven track record'}
        </CardDescription>
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
                  'Add Google Maps link in gym settings'
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
                  'Add Instagram or Facebook link in gym settings'
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
                  'Set up Stripe Connect to receive payments'
                )}
              </div>
            </div>
          </div>

          {/* Admin Approval */}
          <div className="flex items-start gap-3">
            {requirements.adminApproved ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Admin Approval</div>
              <div className="text-xs text-gray-600">
                {requirements.adminApproved 
                  ? 'Approved by admin'
                  : 'Pending admin review. This happens automatically once other requirements are met.'}
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {verificationStatus === 'draft' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium mb-1">Your gym is in Draft mode</p>
            <p className="text-xs text-yellow-700">
              {allMet 
                ? 'All requirements met! Waiting for admin approval to go live.'
                : 'Complete all requirements above to make your gym visible and bookable.'}
            </p>
          </div>
        )}

        {verificationStatus === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium mb-1">✓ Your gym is live!</p>
            <p className="text-xs text-green-700">
              Your gym is visible in search results and can receive bookings.
            </p>
          </div>
        )}

        {verificationStatus === 'trusted' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">⭐ Trusted Gym Badge</p>
            <p className="text-xs text-blue-700">
              Your gym has proven track record with completed bookings and good ratings.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {verificationStatus === 'draft' && (
          <div className="flex gap-2 pt-2 border-t">
            {!gym.stripe_account_id && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = '/manage/stripe-connect'}
              >
                Set Up Stripe Connect
              </Button>
            )}
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.href = `/manage/gym/edit?id=${gym.id}`}
            >
              Update Gym Info
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
