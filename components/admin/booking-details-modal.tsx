'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, Mail, Phone, MapPin, CreditCard, Package, Building2, FileText, DollarSign, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Booking, Gym, Package as PackageType, PackageVariant } from '@/lib/types/database'

interface BookingWithDetails extends Booking {
  gym?: Gym
  package?: PackageType
  variant?: PackageVariant
}

interface BookingDetailsModalProps {
  bookingId: string | null
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export function BookingDetailsModal({ bookingId, isOpen, onClose, onRefresh }: BookingDetailsModalProps) {
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails()
    } else {
      setBooking(null)
      setError(null)
    }
  }, [isOpen, bookingId])

  const fetchBookingDetails = async () => {
    if (!bookingId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch booking details')
      }

      setBooking(data)
    } catch (err: any) {
      console.error('Error fetching booking details:', err)
      setError(err.message || 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending_payment: { label: 'Pending Payment', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      pending_confirmation: { label: 'Pending Confirmation', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800 border-green-200' },
      declined: { label: 'Declined', className: 'bg-red-100 text-red-800 border-red-200' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' }
    }

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const handleCapturePayment = async () => {
    if (!bookingId || !booking) return

    setCapturing(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/capture`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to capture payment')
      }

      // Refresh booking details
      await fetchBookingDetails()
      // Refresh the booking list in admin dashboard
      if (onRefresh) onRefresh()
      alert('Payment captured successfully! Confirmation email has been sent to the guest.')
    } catch (err: any) {
      console.error('Error capturing payment:', err)
      alert(`Failed to capture payment: ${err.message}`)
    } finally {
      setCapturing(false)
    }
  }

  const handleResendConfirmationEmail = async () => {
    if (!bookingId || !booking) return

    setSendingEmail(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/resend-confirmation`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      alert('Confirmation email has been resent to the guest.')
    } catch (err: any) {
      console.error('Error resending email:', err)
      alert(`Failed to resend email: ${err.message}`)
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSyncStripe = async () => {
    if (!bookingId || !booking) return

    setSyncing(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/sync-stripe`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync with Stripe')
      }

      if (data.already_confirmed) {
        alert('Booking is already confirmed. Status is in sync with Stripe.')
      } else if (data.synced) {
        alert(`✅ Booking status synced! ${data.email_sent ? 'Confirmation email sent.' : 'Email not sent (no guest email).'}`)
        // Refresh booking details
        await fetchBookingDetails()
        // Refresh the booking list in admin dashboard
        if (onRefresh) onRefresh()
      } else {
        alert(`Payment not captured in Stripe yet. Status: ${data.stripe_status}`)
      }
    } catch (err: any) {
      console.error('Error syncing with Stripe:', err)
      alert(`Failed to sync with Stripe: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>Booking Details</span>
            {booking && booking.booking_reference && (
              <span className="text-lg font-mono text-gray-600">#{booking.booking_reference}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading booking details...</p>
          </div>
        )}

        {error && (
          <div className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchBookingDetails} className="mt-4">Retry</Button>
          </div>
        )}

        {booking && !loading && !error && (
          <div className="space-y-6">
            {/* Booking Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Booking Status</span>
                  {getStatusBadge(booking.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <div className="font-medium">{formatDateTime(booking.created_at)}</div>
                  </div>
                  {booking.updated_at && (
                    <div>
                      <span className="text-gray-600">Last Updated:</span>
                      <div className="font-medium">{formatDateTime(booking.updated_at)}</div>
                    </div>
                  )}
                </div>
                {booking.booking_reference && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600">Reference:</span>
                    <div className="font-mono font-medium">{booking.booking_reference}</div>
                  </div>
                )}
                {booking.booking_pin && (
                  <div>
                    <span className="text-gray-600">PIN:</span>
                    <div className="font-mono font-medium">{booking.booking_pin}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gym Information */}
            {booking.gym && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Gym Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <div className="font-semibold text-lg">{booking.gym.name}</div>
                  </div>
                  {booking.gym.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-gray-600">Address:</span>
                        <div className="text-sm">{booking.gym.address}</div>
                      </div>
                    </div>
                  )}
                  {(booking.gym.city || booking.gym.country) && (
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <div className="text-sm">
                        {booking.gym.city}{booking.gym.city && booking.gym.country ? ', ' : ''}{booking.gym.country}
                      </div>
                    </div>
                  )}
                  {booking.gym.phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <div className="text-sm">{booking.gym.phone}</div>
                    </div>
                  )}
                  {booking.gym.email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <div className="text-sm">{booking.gym.email}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Package & Variant */}
            {(booking.package || booking.variant) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Package Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {booking.package && (
                    <div>
                      <span className="text-gray-600">Package:</span>
                      <div className="font-semibold">{booking.package.name}</div>
                      {booking.package.description && (
                        <div className="text-sm text-gray-600 mt-1">{booking.package.description}</div>
                      )}
                    </div>
                  )}
                  {booking.variant && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-600">Accommodation Variant:</span>
                      <div className="font-semibold">{booking.variant.name}</div>
                      {booking.variant.description && (
                        <div className="text-sm text-gray-600 mt-1">{booking.variant.description}</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dates & Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Dates & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Check-in:</span>
                    <div className="font-medium">{formatDate(booking.start_date)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-out:</span>
                    <div className="font-medium">{formatDate(booking.end_date)}</div>
                  </div>
                </div>
                {booking.start_date && booking.end_date && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600">Duration:</span>
                    <div className="font-medium">
                      {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))} nights
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.guest_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <div className="font-medium">{booking.guest_name}</div>
                    </div>
                  </div>
                )}
                {booking.guest_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <div className="font-medium">{booking.guest_email}</div>
                    </div>
                  </div>
                )}
                {booking.guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <div className="font-medium">{booking.guest_phone}</div>
                    </div>
                  </div>
                )}
                {booking.user_id && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600">User ID:</span>
                    <div className="font-mono text-sm">{booking.user_id}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Training Details */}
            {(booking.discipline || booking.experience_level || booking.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Training Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {booking.discipline && (
                    <div>
                      <span className="text-gray-600">Discipline:</span>
                      <div className="font-medium">{booking.discipline}</div>
                    </div>
                  )}
                  {booking.experience_level && (
                    <div>
                      <span className="text-gray-600">Experience Level:</span>
                      <div className="font-medium">{booking.experience_level}</div>
                    </div>
                  )}
                  {booking.notes && (
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <div className="text-sm mt-1 whitespace-pre-wrap">{booking.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Total Price:</span>
                    <div className="font-semibold text-lg">
                      {booking.gym?.currency || 'USD'} {booking.total_price?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  {booking.platform_fee && (
                    <div>
                      <span className="text-gray-600">Platform Fee:</span>
                      <div className="font-medium">
                        {booking.gym?.currency || 'USD'} {booking.platform_fee.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
                {booking.stripe_payment_intent_id && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600">Stripe Payment Intent:</span>
                    <div className="font-mono text-sm break-all">{booking.stripe_payment_intent_id}</div>
                  </div>
                )}
                {/* Action buttons for pending bookings */}
                {(booking.status === 'pending_payment' || booking.status === 'pending_confirmation' || booking.status === 'awaiting_approval') && (
                  <div className="pt-4 border-t space-y-3">
                    {booking.stripe_payment_intent_id && (booking.status === 'pending_confirmation' || booking.status === 'awaiting_approval') && (
                      <Button
                        onClick={handleCapturePayment}
                        className="w-full bg-[#003580] hover:bg-[#003580]/90"
                        disabled={capturing}
                      >
                        {capturing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Capturing Payment...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Capture Payment & Confirm Booking
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={handleSyncStripe}
                      variant="outline"
                      className="w-full"
                      disabled={syncing}
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync with Stripe (if already captured)
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {booking.status === 'pending_payment' 
                        ? 'Use "Sync with Stripe" if you manually captured the payment in Stripe dashboard. This will check Stripe and update the booking status if payment was captured.'
                        : 'Use "Sync with Stripe" if you manually captured the payment in Stripe dashboard'}
                    </p>
                  </div>
                )}
                {booking.status === 'confirmed' && booking.guest_email && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleResendConfirmationEmail}
                      variant="outline"
                      className="w-full"
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Resend Confirmation Email
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Resend the booking confirmed email to the guest
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {booking.id && (
                  <div>
                    <span className="text-gray-600">Booking ID:</span>
                    <div className="font-mono text-xs">{booking.id}</div>
                  </div>
                )}
                {booking.gym_id && (
                  <div>
                    <span className="text-gray-600">Gym ID:</span>
                    <div className="font-mono text-xs">{booking.gym_id}</div>
                  </div>
                )}
                {booking.package_id && (
                  <div>
                    <span className="text-gray-600">Package ID:</span>
                    <div className="font-mono text-xs">{booking.package_id}</div>
                  </div>
                )}
                {booking.package_variant_id && (
                  <div>
                    <span className="text-gray-600">Variant ID:</span>
                    <div className="font-mono text-xs">{booking.package_variant_id}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
