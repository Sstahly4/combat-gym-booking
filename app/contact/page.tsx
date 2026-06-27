'use client'

import { useEffect, useState } from 'react'
import { SupportAudienceSwitcher } from '@/components/help/support-audience-switcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CREATOR_PROGRAM_MESSAGE_PROMPT,
  CREATOR_PROGRAM_SUBJECT,
  DATA_DELETION_SUBJECT,
  PARTNER_SUPPORT_SUBJECT,
  validateContactMessage,
} from '@/lib/contact-form'

const DATA_DELETION_MESSAGE_PROMPT =
  'Please confirm the email address on your CombatStay account. Include your booking reference if you have an active booking so we can verify your identity.'

const PARTNER_SUPPORT_MESSAGE_PROMPT =
  'Tell us your gym name and the email on your Partner Hub account. Include your booking reference if this is about a specific guest stay.'

export default function ContactPage() {
  const [isCreatorProgram, setIsCreatorProgram] = useState(false)
  const [isDataDeletion, setIsDataDeletion] = useState(false)
  const [isPartnerSupport, setIsPartnerSupport] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bookingReference: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const intent = params.get('intent')
    const subject = params.get('subject')
    const creatorProgram =
      intent === 'creator-program' || subject === CREATOR_PROGRAM_SUBJECT
    const dataDeletion =
      intent === 'data-deletion' || subject === DATA_DELETION_SUBJECT
    const partnerSupport =
      intent === 'partner' || subject === PARTNER_SUPPORT_SUBJECT

    setIsCreatorProgram(creatorProgram)
    setIsDataDeletion(dataDeletion && !creatorProgram && !partnerSupport)
    setIsPartnerSupport(partnerSupport && !creatorProgram)
    if (!creatorProgram && !dataDeletion && !partnerSupport && !subject) return

    setFormData(prev => ({
      ...prev,
      subject: creatorProgram
        ? CREATOR_PROGRAM_SUBJECT
        : dataDeletion
          ? DATA_DELETION_SUBJECT
          : partnerSupport
            ? PARTNER_SUPPORT_SUBJECT
            : subject || prev.subject,
      message:
        dataDeletion && !prev.message
          ? DATA_DELETION_MESSAGE_PROMPT
          : partnerSupport && !prev.message
            ? PARTNER_SUPPORT_MESSAGE_PROMPT
            : prev.message,
    }))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const messageError = validateContactMessage(formData.message, {
      creatorProgram: isCreatorProgram,
    })
    if (messageError) {
      setError(messageError)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        bookingReference: '',
        subject: '',
        message: ''
      })
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isCreatorProgram
              ? 'Apply to the Creator Program'
              : isDataDeletion
                ? 'Request data deletion'
                : isPartnerSupport
                  ? 'Partner support'
                  : 'Customer service'}
          </h1>
          <p className="text-base text-gray-600">
            {isCreatorProgram
              ? 'Tell us about your audience and channels. We review every application personally and aim to reply within one business day.'
              : isDataDeletion
                ? 'Submit this form to delete your CombatStay account and personal data. We verify ownership of the account email before processing. See our data deletion page for full details.'
                : isPartnerSupport
                  ? 'Questions about your listing, payouts, or Partner Hub — include your gym name and the email on your account so we can help faster.'
                  : 'Bookings, payments, and account questions — send a message below. We aim to reply within one business day; include your booking reference when you have one so we can help faster.'}
          </p>
        </div>

        <SupportAudienceSwitcher active={isPartnerSupport ? 'partner' : 'traveler'} />

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2">
            <Card className="border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {isCreatorProgram ? 'Your application' : 'Send us a message'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                    <p className="text-green-800 font-semibold mb-1">
                      {isCreatorProgram ? 'Application received' : 'Message received'}
                    </p>
                    <p className="text-sm text-green-700">
                      {isCreatorProgram
                        ? 'Thanks for applying. We will review your application and get back to you as soon as we can — typically within one business day.'
                        : 'We&apos;ve received your message and will get back to you as soon as we can — typically within one business day.'}
                    </p>
                  </div>
                ) : null}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                    <p className="text-red-800 font-semibold mb-1">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="h-11 border-gray-300 focus:border-[#003580] focus:ring-[#003580]"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="h-11 border-gray-300 focus:border-[#003580] focus:ring-[#003580]"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {!isCreatorProgram ? (
                    <div>
                      <Label htmlFor="bookingReference" className="text-sm font-medium text-gray-700 mb-2 block">
                        Booking Reference <span className="text-gray-500 font-normal">(if applicable)</span>
                      </Label>
                      <Input
                        id="bookingReference"
                        name="bookingReference"
                        type="text"
                        value={formData.bookingReference}
                        onChange={handleChange}
                        className="h-11 border-gray-300 focus:border-[#003580] focus:ring-[#003580]"
                        placeholder="BK-XXXX"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Include your booking reference if your inquiry is about an existing booking
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-2 block">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      readOnly={isCreatorProgram || isDataDeletion}
                      value={formData.subject}
                      onChange={handleChange}
                      className="h-11 border-gray-300 focus:border-[#003580] focus:ring-[#003580] read-only:bg-gray-50 read-only:text-gray-600"
                      placeholder="What is your inquiry about?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                      {isCreatorProgram ? 'About you and your audience *' : 'Message *'}
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={8}
                      className="resize-none border-gray-300 focus:border-[#003580] focus:ring-[#003580]"
                      placeholder={
                        isCreatorProgram
                          ? CREATOR_PROGRAM_MESSAGE_PROMPT
                          : isDataDeletion
                            ? DATA_DELETION_MESSAGE_PROMPT
                            : 'Please provide as much detail as possible so we can assist you better...'
                      }
                    />
                    {isCreatorProgram ? (
                      <p className="text-xs text-gray-500 mt-2">
                        Include your audience size, main channels, and how you would like to partner with CombatStay.
                      </p>
                    ) : null}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading || success}
                      className="w-full bg-[#003580] hover:bg-[#003580]/90 text-white font-medium h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? 'Sending...'
                        : success
                          ? isCreatorProgram
                            ? 'Application Sent'
                            : 'Message Sent'
                          : isCreatorProgram
                            ? 'Submit application'
                            : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Help Section */}
            <Card className="border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Need help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Common Questions</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="text-[#003580] mr-2">•</span>
                      <span>Booking modifications</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#003580] mr-2">•</span>
                      <span>Payment issues</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#003580] mr-2">•</span>
                      <span>Cancellation requests</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#003580] mr-2">•</span>
                      <span>Account assistance</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Response Time</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We aim to reply within one business day.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Access */}
            <Card className="border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Manage your booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Need to view or update your booking? Use your booking reference and PIN to access it.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white h-10"
                  onClick={() => window.location.href = '/bookings'}
                >
                  Access My Booking
                </Button>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="border border-gray-200 rounded-lg shadow-sm bg-gray-50">
              <CardContent className="pt-6">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Quick Tips</h4>
                <ul className="text-xs text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Include your booking reference for faster assistance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Provide as much detail as possible in your message</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Check your email for our response</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
