'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ContactPage() {
  useEffect(() => {
    // Set document title
    document.title = 'Contact Customer Service - CombatBooking.com'
    
    // Set or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'Get in touch with our customer service team. We\'re here to help with your booking questions and support needs.')
    
    // Set Open Graph tags
    const setMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(property.startsWith('og:') ? 'property' : 'name', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }
    
    setMetaTag('og:title', 'Contact Customer Service - CombatBooking.com')
    setMetaTag('og:description', 'Get in touch with our customer service team. We\'re here to help with your booking questions and support needs.')
    setMetaTag('og:type', 'website')
    if (typeof window !== 'undefined') {
      setMetaTag('og:url', window.location.href)
    }
    
    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary')
    setMetaTag('twitter:title', 'Contact Customer Service - CombatBooking.com')
    setMetaTag('twitter:description', 'Get in touch with our customer service team. We\'re here to help with your booking questions and support needs.')
    
    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    if (typeof window !== 'undefined') {
      canonical.setAttribute('href', window.location.href)
    }
  }, [])
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Customer Service</h1>
          <p className="text-base text-gray-600">
            We're here to help. Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2">
            <Card className="border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                    <p className="text-green-800 font-semibold mb-1">Thank you for contacting us!</p>
                    <p className="text-sm text-green-700">
                      We've received your message and will get back to you within 24 hours.
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

                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-2 block">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="h-11 border-gray-300 focus:border-[#003580] focus:ring-[#003580]"
                      placeholder="What is your inquiry about?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={8}
                      className="resize-none border-gray-300 focus:border-[#003580] focus:ring-[#003580]"
                      placeholder="Please provide as much detail as possible so we can assist you better..."
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading || success}
                      className="w-full bg-[#003580] hover:bg-[#003580]/90 text-white font-medium h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : success ? 'Message Sent' : 'Send Message'}
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
                    We typically respond within 24 hours during business days.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Access */}
            <Card className="border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Manage Your Booking</CardTitle>
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
