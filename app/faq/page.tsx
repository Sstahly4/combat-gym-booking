'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, Shield, Dumbbell, FileText, HelpCircle, Banknote } from 'lucide-react'

export default function FAQPage() {
  useEffect(() => {
    // Set document title
    document.title = 'Help Center - CombatStay.com'
    
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
    
    setMetaTag('og:title', 'Help Center - CombatStay.com')
    setMetaTag('og:description', 'Find answers to common questions about bookings, safety, training, and more. Get help with your training camp bookings.')
    setMetaTag('og:type', 'website')
    if (typeof window !== 'undefined') {
      setMetaTag('og:url', window.location.href)
    }
    
    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary')
    setMetaTag('twitter:title', 'Help Center - CombatStay.com')
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
  /** Plain text (pre-line) or rich content with links. */
  answer: string | ReactNode
  category: string
}

const faqCategories = [
  { id: 'safety', label: 'Safety & Security', icon: Shield },
  { id: 'bookings', label: 'Bookings', icon: FileText },
  { id: 'payments', label: 'Payments & disputes', icon: Banknote },
  { id: 'gyms', label: 'Gyms & Training', icon: Dumbbell },
  { id: 'general', label: 'General', icon: HelpCircle },
]

/** Inline text links in help answers (no raw URL paths in copy). */
const faqInlineLink =
  'font-semibold text-[#003580] underline decoration-[#003580]/35 underline-offset-2 hover:decoration-[#003580]'

/** Primary self-service tiles (Booking-style “Manage booking” entry points). */
const faqJumpTile =
  'inline-flex w-full flex-col items-stretch justify-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm transition-colors hover:border-[#003580]/35 hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/25'

const faqs: FAQItem[] = [
  // Safety & Security
  {
    id: 'safety-1',
    category: 'safety',
    question: 'What safety measures do gyms have in place?',
    answer:
      'Listed gyms must meet our standards: qualified coaches, suitable equipment, and basic emergency procedures. We check credentials and insurance before approval. CombatStay connects you with the gym — we do not run the facility. Training carries risk; you participate at your own risk.',
  },
  {
    id: 'safety-2',
    category: 'safety',
    question: 'What should I do if I feel unsafe at a gym?',
    answer: (
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
        <li>Leave the situation.</li>
        <li>If it is an emergency, call local emergency services.</li>
        <li>
          Tell us through{' '}
          <Link href="/contact" className={faqInlineLink}>
            Customer service
          </Link>{' '}
          with your booking reference and any photos or notes.
        </li>
      </ol>
    ),
  },
  {
    id: 'safety-3',
    category: 'safety',
    question: 'Are trainers certified and qualified?',
    answer:
      'Yes. Gyms must show appropriate coaching credentials for what they teach (e.g. recognised bodies for Muay Thai, boxing, BJJ). We check this at approval. Ongoing quality and current certs are between you and the gym — ask them directly if you need proof.',
  },
  {
    id: 'safety-4',
    category: 'safety',
    question: 'What medical requirements should I be aware of?',
    answer:
      'Get medical clearance if you are unsure you are fit for combat sports. Tell your coach about injuries, conditions, and medication. Buy travel/health cover that explicitly includes combat sports — many policies exclude it. Know your limits. First aid at the gym is basic; medical decisions and costs are yours.',
  },
  {
    id: 'safety-5',
    category: 'safety',
    question: 'What insurance coverage do I need?',
    answer:
      'Use travel insurance that covers medical emergencies, sports injury (including combat sports), and trip changes. The gym’s liability cover does not replace your personal cover. Confirm wording with your insurer — many standard policies exclude combat sports.',
  },
  {
    id: 'safety-6',
    category: 'safety',
    question: 'How are gym facilities inspected?',
    answer:
      'We verify each gym before listing (facility, credentials, safety basics) and review reports from guests. We do not run daily on-site inspections. If something looks wrong, stop training and tell us — we investigate serious reports.',
  },
  // Bookings
  {
    id: 'booking-nav',
    category: 'bookings',
    question: 'Where do I find and manage my bookings (and saved gyms)?',
    answer: (
      <div className="space-y-5 text-gray-700">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Self-service</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href="/bookings" className={faqJumpTile}>
              <span className="text-sm font-semibold text-gray-900">Manage your booking</span>
              <span className="text-xs font-normal text-gray-500">
                View all trips on your account, or look up one booking with reference and PIN
              </span>
            </Link>
            <Link href="/saved" className={faqJumpTile}>
              <span className="text-sm font-semibold text-gray-900">Saved gyms</span>
              <span className="text-xs font-normal text-gray-500">Favourites you saved on this device</span>
            </Link>
            <Link href="/contact" className={faqJumpTile}>
              <span className="text-sm font-semibold text-gray-900">Customer service</span>
              <span className="text-xs font-normal text-gray-500">Changes, cancellations, and questions</span>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50/90 p-4">
          <p className="mb-2 text-sm font-semibold text-gray-900">Signed in</p>
          <p className="text-sm leading-relaxed">
            Menu (top right): <strong>Find bookings</strong> or footer <strong>My bookings</strong> — same screen as{' '}
            <strong>Manage your booking</strong> above. <strong>Saved gyms</strong> in the menu lists favourites.
          </p>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50/90 p-4">
          <p className="mb-2 text-sm font-semibold text-gray-900">Signed out</p>
          <p className="text-sm leading-relaxed">
            Menu → <strong>Help</strong> → <strong>Find your booking</strong> (guest flow ={' '}
            <strong>Manage your booking</strong> above). <strong>Saved gyms</strong> there = favourites on this
            device.
          </p>
        </div>

        <p className="text-sm leading-relaxed">
          Confirmation emails include reference, PIN, and direct links. Anything you cannot finish online:{' '}
          <Link href="/contact" className={faqInlineLink}>
            Customer service
          </Link>{' '}
          + booking reference.
        </p>
      </div>
    ),
  },
  {
    id: 'booking-1',
    category: 'bookings',
    question: 'How do I modify or cancel my booking?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Message{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>{' '}
        with your booking reference. Changes and refunds follow the package rules on your confirmation and what you
        accepted at checkout (including any free-cancellation window).
      </p>
    ),
  },
  {
    id: 'booking-2',
    category: 'bookings',
    question: 'When will I be charged for my booking?',
    answer:
      'We usually place a temporary hold on your card at checkout. You are charged only after the free-cancellation deadline on your package (if there is one). Cancel before that time and the hold is released. No free-cancellation window? You may be charged sooner — the checkout screen states the exact rule. Some flows still need the gym to confirm dates first.',
  },
  {
    id: 'payments-1',
    category: 'payments',
    question: 'Who charges my card?',
    answer:
      'CombatStay appears on your bank statement. We collect payment under the terms you accept at checkout. The gym delivers your training or stay as an independent partner.',
  },
  {
    id: 'payments-2',
    category: 'payments',
    question: 'When does the gym get paid?',
    answer:
      'For you as a guest, only two things matter: (1) cancellation rules are exactly what you saw at checkout, and (2) your card is captured after the free-cancellation deadline when one applies. How and when we settle with the gym may change operationally; your booking terms do not change after you pay.',
  },
  {
    id: 'payments-3',
    category: 'payments',
    question: 'What if I cancel inside or outside the cancellation window?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        <strong>Inside the free window</strong> — cancel before the date and time on your package: we release the
        card hold; you are not charged. <strong>After the window</strong> — your payment may be captured and the
        package rules you agreed to apply. If you are not sure which applies, open{' '}
        <Link href="/bookings" className={faqInlineLink}>
          Manage your booking
        </Link>{' '}
        or message{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>{' '}
        with your booking reference.
      </p>
    ),
  },
  {
    id: 'payments-4',
    category: 'payments',
    question: 'What if I dispute the charge with my bank?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Message{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>{' '}
        first with your booking reference — most problems are fixed faster than a card dispute. If you still
        charge back, we may send your bank the checkout terms you accepted. Abuse of disputes can limit future
        bookings. Your statutory rights still apply where the law says so.
      </p>
    ),
  },
  {
    id: 'booking-3',
    category: 'bookings',
    question: 'What if the gym declines my booking?',
    answer:
      'You are not charged. We email you straight away and can suggest other gyms when possible. Your bank usually releases the hold within a few business days.',
  },
  {
    id: 'booking-4',
    category: 'bookings',
    question: 'How do I access my booking without an account?',
    answer: (
      <div className="space-y-4 text-gray-700">
        <p className="text-sm leading-relaxed">
          Open{' '}
          <Link href="/bookings" className={faqInlineLink}>
            Manage your booking
          </Link>
          , then enter the reference number and PIN from your confirmation email. Your email also includes a magic
          link for one-tap access — no password needed.
        </p>
        <p className="text-sm leading-relaxed">
          On a phone while signed out: open the menu, go to <strong>Help</strong>, then tap{' '}
          <strong>Find your booking</strong> — same screen as the link above.
        </p>
        <p className="text-sm leading-relaxed">
          For every way to reach bookings and saved gyms (menu, footer, email), see{' '}
          <Link href="#faq-booking-nav" className={faqInlineLink}>
            Where do I find and manage my bookings (and saved gyms)?
          </Link>{' '}
          in this Help Center.
        </p>
      </div>
    ),
  },
  // Gyms & Training
  {
    id: 'gym-1',
    category: 'gyms',
    question: 'What equipment do I need to bring?',
    answer:
      'It depends on the gym and style. Often you bring wraps, gloves, mouthguard, shins (Muay Thai), and training clothes. Read the package page or ask the gym before you pack.',
  },
  {
    id: 'gym-2',
    category: 'gyms',
    question: 'What skill level do I need?',
    answer:
      'All levels — pick a package that matches your experience. Tell your coach honestly how long you have trained so they can set the right pace.',
  },
  {
    id: 'gym-3',
    category: 'gyms',
    question: 'Can I train multiple disciplines at one gym?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Many gyms offer more than one discipline. Check the gym profile and package. For special requests, email
        the gym from your confirmation, or use{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>
        .
      </p>
    ),
  },
  // Safety & Security (extra)
  {
    id: 'safety-7',
    category: 'safety',
    question: 'How is my personal data protected?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        TLS in transit, restricted access in storage. We only pass the gym what they need for your stay (for example
        name, dates, level). We do not sell personal data. For access or deletion requests, use{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>
        . Full detail:{' '}
        <Link href="/privacy" className={faqInlineLink}>
          Privacy policy
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'safety-8',
    category: 'safety',
    question: 'Is my payment information stored securely?',
    answer:
      'Yes. PCI-compliant processor, tokenised cards — we never store your full number or CVV on our servers. Checkout is encrypted like any major travel site.',
  },
  {
    id: 'safety-9',
    category: 'safety',
    question: 'How do I know a gym is legitimate before I book?',
    answer:
      'We list only gyms that pass our checks (business, coaches, photos, insurance, conduct rules). Guest reviews and repeated complaints can remove a listing. On the site, prefer profiles marked verified.',
  },
  {
    id: 'safety-10',
    category: 'safety',
    question: 'What happens if a gym closes or cancels after I\'ve booked?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Full refund if the gym cancels or shuts before you train. We email you immediately and suggest alternatives
        when we can. Rebook or refund questions:{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>
        .
      </p>
    ),
  },
  // Bookings (extra)
  {
    id: 'booking-5',
    category: 'bookings',
    question: 'How long does a refund take?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        We start the refund as soon as cancellation is confirmed. Banks usually show it in{' '}
        <strong>5–10 business days</strong>. You get an email when we have sent it. Nothing after 10 days?{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>{' '}
        + booking reference.
      </p>
    ),
  },
  {
    id: 'booking-6',
    category: 'bookings',
    question: 'What exactly is included in my booking?',
    answer:
      'Only what the package page and your confirmation list — sessions per day, room type if “Train & Stay”, meals if stated. Airport transfers, gear, and extra sessions are not included unless the gym confirms in writing. Ask the gym before you pay if anything is unclear.',
  },
  {
    id: 'booking-7',
    category: 'bookings',
    question: 'Can I transfer or gift my booking to someone else?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Usually <strong>no</strong> — the gym plans for the name on the booking. Some gyms allow a name change with
        notice. Ask early via{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>
        , and we will ask the gym. Last-minute changes may follow cancellation rules.
      </p>
    ),
  },
  {
    id: 'booking-8',
    category: 'bookings',
    question: 'Will I receive a booking confirmation?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Yes — request received right after checkout, then a final confirmation when the gym accepts (often within{' '}
        <strong>24–48 hours</strong>). Both include reference, PIN, package, and gym contact. Missing mail? Check spam,
        then{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>{' '}
        with the email you used to book.
      </p>
    ),
  },
  // Gyms & Training (extra)
  {
    id: 'gym-4',
    category: 'gyms',
    question: 'What should I expect on my first day?',
    answer:
      'Meet-and-greet, quick tour, then an easy first session so your coach can gauge fitness and skill. Hydrate, do not max out on day one, and say how you feel.',
  },
  {
    id: 'gym-5',
    category: 'gyms',
    question: 'Is the training suitable for complete beginners?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Yes — filter for beginner-friendly packages. Coaches expect first-timers. Still unsure?{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>{' '}
        can narrow options.
      </p>
    ),
  },
  {
    id: 'gym-6',
    category: 'gyms',
    question: 'What if I have dietary requirements or food allergies?',
    answer:
      'Tell the gym in writing before you arrive (ideally when you book). Use the email in your confirmation. Halal, vegan, allergies, etc. need explicit “yes” from them — we cannot guarantee what we do not control.',
  },
  {
    id: 'gym-7',
    category: 'gyms',
    question: 'How do I communicate with the gym before I arrive?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        After confirmation, email / phone / WhatsApp is in your confirmation mail — message them directly. No reply?{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>
        .
      </p>
    ),
  },
  // General (extra)
  {
    id: 'general-1',
    category: 'general',
    question: 'How do I leave a review?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        After your stay we email an invite. Or open the review link from{' '}
        <Link href="/bookings" className={faqInlineLink}>
          Manage your booking
        </Link>
        . Only guests with a completed, verified stay can review.
      </p>
    ),
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'What payment methods do you accept?',
    answer:
      'Major debit and credit cards (Visa, Mastercard, American Express) through our secure checkout. Hold at booking; charge after rules you see at checkout. We never store full card data.',
  },
  {
    id: 'general-3',
    category: 'general',
    question: 'How do I reach Customer service?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Use{' '}
        <Link href="/contact" className={faqInlineLink}>
          Customer service
        </Link>{' '}
        (same link as <strong>Customer service</strong> in the footer). Add your booking reference. Typical reply:
        within one
        business day. On-site emergency: call local emergency services first; for platform help the same day, start
        your message with <strong>URGENT</strong>.
      </p>
    ),
  },
  {
    id: 'general-4',
    category: 'general',
    question: 'Can I trust the reviews on the platform?',
    answer:
      'Reviews are only from guests who finished a confirmed stay at that gym — no anonymous posts. We remove abuse; we do not sell “delete bad review” to gyms.',
  },
  {
    id: 'general-5',
    category: 'general',
    question: 'How do I create an account?',
    answer: (
      <p className="text-sm leading-relaxed text-gray-700">
        Sign up with Google or email + password. Booking without an account? Use{' '}
        <Link href="/bookings" className={faqInlineLink}>
          Manage your booking
        </Link>{' '}
        with reference + PIN from your email, or tap the magic link in that email. With an account: all trips in one
        list, saved gyms, faster checkout.
      </p>
    ),
  },
  {
    id: 'general-6',
    category: 'general',
    question: 'Does CombatStay.com take a commission from gyms?',
    answer:
      'Gyms pay us a platform fee so travellers can use the site for free. Listed prices are set by the gym — we do not mark them up.',
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

  /** Deep-link e.g. /faq#faq-booking-nav — switch category, expand, scroll (OTA help pattern). */
  useEffect(() => {
    const applyHash = () => {
      if (typeof window === 'undefined') return
      const raw = window.location.hash.replace(/^#/, '')
      if (!raw.startsWith('faq-')) return
      const faqId = raw.slice(4)
      const entry = faqs.find((f) => f.id === faqId)
      if (entry) setSelectedCategory(entry.category)
      setOpenItems((prev) => {
        const next = new Set(prev)
        next.add(faqId)
        return next
      })
      window.requestAnimationFrame(() => {
        document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqs is static content for this page
  }, [])

  const filteredFAQs = faqs.filter(faq => faq.category === selectedCategory)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-base text-gray-600">
            Short answers on bookings, payments, gyms, and safety — same self-service style as major travel sites.
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
                <Card
                  key={faq.id}
                  id={`faq-${faq.id}`}
                  className="border border-gray-200 rounded-lg shadow-sm scroll-mt-24"
                >
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
                      {typeof faq.answer === 'string' ? (
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                      ) : (
                        <div className="text-sm text-gray-600 leading-relaxed">{faq.answer}</div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Important Disclaimer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-600">Disclaimer:</strong> CombatStay.com is a booking platform that facilitates connections between users and training facilities. We do not operate, control, or manage any gym facilities. Participation in combat sports training involves inherent risks. You participate at your own risk. Please review our <Link href="/terms" className="text-[#003580] hover:underline">Terms & Conditions</Link> for complete details.
              </p>
            </div>

            {/* Still Need Help */}
            <Card className="border border-[#003580] rounded-lg shadow-sm mt-6 bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Tell us what you need — we reply faster when you add your booking reference.
                    </p>
                    <Link href="/contact" className={`text-sm ${faqInlineLink}`}>
                      Customer service →
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
