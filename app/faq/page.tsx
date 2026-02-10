'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, Shield, Dumbbell, FileText, HelpCircle } from 'lucide-react'
import { useEffect } from 'react'

export default function FAQPage() {
  useEffect(() => {
    // Set document title
    document.title = 'Help Center - CombatBooking.com'
    
    // Set or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'Find answers to common questions about bookings, safety, training, and more. Get help with your training camp bookings.')
    
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
    
    setMetaTag('og:title', 'Help Center - CombatBooking.com')
    setMetaTag('og:description', 'Find answers to common questions about bookings, safety, training, and more. Get help with your training camp bookings.')
    setMetaTag('og:type', 'website')
    if (typeof window !== 'undefined') {
      setMetaTag('og:url', window.location.href)
    }
    
    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary')
    setMetaTag('twitter:title', 'Help Center - CombatBooking.com')
    setMetaTag('twitter:description', 'Find answers to common questions about bookings, safety, training, and more. Get help with your training camp bookings.')
    
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

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const faqCategories = [
  { id: 'safety', label: 'Safety & Security', icon: Shield },
  { id: 'bookings', label: 'Bookings', icon: FileText },
  { id: 'gyms', label: 'Gyms & Training', icon: Dumbbell },
  { id: 'general', label: 'General', icon: HelpCircle },
]

const faqs: FAQItem[] = [
  // Safety & Security
  {
    id: 'safety-1',
    category: 'safety',
    question: 'What safety measures do gyms have in place?',
    answer: 'All gyms listed on our platform are required to maintain proper safety standards including certified trainers, appropriate equipment, and emergency protocols. We verify gym credentials and conduct regular safety reviews. Each gym must provide proof of insurance and safety certifications before being approved on our platform. However, we are a booking platform and do not directly operate or control the gym facilities. Users participate at their own risk.'
  },
  {
    id: 'safety-2',
    category: 'safety',
    question: 'What should I do if I feel unsafe at a gym?',
    answer: 'Your safety is our top priority. If you feel unsafe at any time, please: 1) Remove yourself from the situation immediately, 2) Contact local emergency services if needed, 3) Report the incident to us immediately via our support page with your booking reference, 4) Document any concerns with photos or notes. We take all safety reports seriously and will investigate promptly.'
  },
  {
    id: 'safety-3',
    category: 'safety',
    question: 'Are trainers certified and qualified?',
    answer: 'Yes, all gyms must verify that their trainers hold appropriate certifications for the disciplines they teach. This includes recognized certifications from governing bodies such as the World Muay Thai Council, International Boxing Federation, or equivalent organizations. We verify these credentials during the gym approval process. However, we cannot guarantee the ongoing validity of certifications or the quality of training provided. Users should verify trainer credentials directly with the gym if needed.'
  },
  {
    id: 'safety-4',
    category: 'safety',
    question: 'What medical requirements should I be aware of?',
    answer: 'Before participating in any combat sports training, we strongly recommend: 1) Consulting with a healthcare provider to ensure you are physically fit for combat sports, 2) Disclosing any pre-existing medical conditions, injuries, or medications to your trainer, 3) Ensuring you have appropriate travel/health insurance that covers combat sports activities, 4) Being aware of your physical limitations and not exceeding them. Gyms are required to have basic first aid supplies and emergency contact procedures, but medical care is ultimately your responsibility. We are not responsible for any medical issues that arise during training.'
  },
  {
    id: 'safety-5',
    category: 'safety',
    question: 'What insurance coverage do I need?',
    answer: 'We strongly recommend comprehensive travel insurance that covers medical emergencies, sports injuries (specifically combat sports), and trip cancellation. While gyms may maintain their own liability insurance, this does not cover participant injuries. You are responsible for obtaining adequate personal health and travel insurance. Check with your insurance provider to ensure combat sports training is explicitly covered in your policy, as many standard policies exclude combat sports. We are not responsible for any medical costs or expenses incurred during training.'
  },
  {
    id: 'safety-6',
    category: 'safety',
    question: 'How are gym facilities inspected?',
    answer: 'Gyms undergo initial verification before being listed, including facility inspection, trainer certification checks, and safety protocol review. We conduct periodic reviews and respond immediately to any safety concerns reported by users. Gyms must maintain their safety standards to remain on our platform. However, we are a booking platform and do not continuously monitor or inspect facilities. We rely on gym representations and user reports. We are not responsible for the condition of facilities or any issues that may arise.'
  },
  // Bookings
  {
    id: 'booking-1',
    category: 'bookings',
    question: 'How do I modify or cancel my booking?',
    answer: 'You can request modifications or cancellations by contacting us through the support page with your booking reference. Cancellation policies vary by gym and package type - check your booking confirmation for specific terms. Free cancellation policies are clearly displayed on each package. Refunds are processed according to the gym\'s cancellation policy.'
  },
  {
    id: 'booking-2',
    category: 'bookings',
    question: 'When will I be charged for my booking?',
    answer: 'Your payment method is authorized when you complete the booking, but funds are only charged after the gym confirms availability. This typically happens within 24-48 hours. You\'ll receive an email confirmation once your payment is processed and the booking is confirmed.'
  },
  {
    id: 'booking-3',
    category: 'bookings',
    question: 'What if the gym declines my booking?',
    answer: 'If a gym is unable to accommodate your booking, your payment authorization will be released immediately and you won\'t be charged. We\'ll notify you by email and help you find alternative options if needed. Your authorization typically releases within 5-7 business days depending on your bank.'
  },
  {
    id: 'booking-4',
    category: 'bookings',
    question: 'How do I access my booking without an account?',
    answer: 'You can access your booking using your booking reference and PIN, which are provided in your confirmation email. Visit the "My Bookings" page and enter these details. You can also use the magic link sent to your email for instant access without a password.'
  },
  // Gyms & Training
  {
    id: 'gym-1',
    category: 'gyms',
    question: 'What equipment do I need to bring?',
    answer: 'Equipment requirements vary by discipline and gym. Most gyms provide basic training equipment, but you may need to bring: hand wraps, gloves (for boxing/Muay Thai), mouthguard, shin guards (for Muay Thai), and appropriate training attire. Check with your specific gym or review their package details for equipment requirements.'
  },
  {
    id: 'gym-2',
    category: 'gyms',
    question: 'What skill level do I need?',
    answer: 'Our platform caters to all skill levels, from complete beginners to professional fighters. Each gym and package clearly indicates the recommended experience level. Many gyms offer beginner-friendly programs, while others focus on advanced training. Always communicate your experience level with trainers to ensure appropriate training intensity.'
  },
  {
    id: 'gym-3',
    category: 'gyms',
    question: 'Can I train multiple disciplines at one gym?',
    answer: 'Many gyms offer training in multiple disciplines. Check the gym\'s profile to see which disciplines they offer. Some packages include cross-training options, while others focus on a single discipline. Contact the gym directly or use our support page if you have specific training requirements.'
  },
  // General
  {
    id: 'general-1',
    category: 'general',
    question: 'How do I leave a review?',
    answer: 'After completing your training stay, you\'ll receive an email invitation to leave a review. You can also access the review page through your booking details. Reviews help other fighters make informed decisions and help gyms improve their services. Only verified bookings can leave reviews to ensure authenticity.'
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards through our secure payment processor. Your card is authorized at booking and charged only after the gym confirms availability. All transactions are encrypted and secure. We do not store your full card details on our servers.'
  },
  {
    id: 'general-3',
    category: 'general',
    question: 'How do I contact customer support?',
    answer: 'You can reach our support team through the "Get Support" page, available in the footer. Include your booking reference for faster assistance. We typically respond within 24 hours during business days. For urgent matters related to active bookings, please include "URGENT" in your subject line.'
  },
]

  const [selectedCategory, setSelectedCategory] = useState<string>('safety')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpen = new Set(openItems)
    if (newOpen.has(id)) {
      newOpen.delete(id)
    } else {
      newOpen.add(id)
    }
    setOpenItems(newOpen)
  }

  const filteredFAQs = faqs.filter(faq => faq.category === selectedCategory)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-base text-gray-600">
            Find answers to common questions about bookings, safety, and training
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <Card className="border border-gray-200 rounded-lg shadow-sm sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {faqCategories.map((category) => {
                  const Icon = category.icon
                  const count = faqs.filter(f => f.category === category.id).length
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        selectedCategory === category.id
                          ? 'bg-[#003580] text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{category.label}</div>
                        <div className={`text-xs ${selectedCategory === category.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {count} questions
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <Card key={faq.id} className="border border-gray-200 rounded-lg shadow-sm">
                  <CardHeader
                    className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleItem(faq.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base font-semibold text-gray-900 pr-8">
                        {faq.question}
                      </CardTitle>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                          openItems.has(faq.id) ? 'transform rotate-180' : ''
                        }`}
                      />
                    </div>
                  </CardHeader>
                  {openItems.has(faq.id) && (
                    <CardContent className="pt-0 pb-6">
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Important Disclaimer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-600">Disclaimer:</strong> CombatBooking.com is a booking platform that facilitates connections between users and training facilities. We do not operate, control, or manage any gym facilities. Participation in combat sports training involves inherent risks. You participate at your own risk. Please review our <Link href="/terms" className="text-[#003580] hover:underline">Terms & Conditions</Link> for complete details.
              </p>
            </div>

            {/* Still Need Help */}
            <Card className="border border-[#003580] rounded-lg shadow-sm mt-6 bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Can't find what you're looking for? Our support team is here to assist you.
                    </p>
                    <Link href="/contact">
                      <button className="text-sm text-[#003580] font-medium hover:underline">
                        Contact Support →
                      </button>
                    </Link>
                  </div>
                  <HelpCircle className="w-12 h-12 text-[#003580] flex-shrink-0 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
