'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown } from 'lucide-react'
import { RotatingWord } from '@/components/owners/rotating-word'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { buildOnboardingWizardUrl } from '@/lib/onboarding/owner-wizard'

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="h-px bg-gray-200" />
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-base font-semibold text-gray-900 leading-snug">{q}</span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-[15px] text-gray-600 leading-relaxed">{a}</p>
      )}
      <div className="h-px bg-gray-200" />
    </div>
  )
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#003580]/10 flex items-center justify-center">
        <Check className="w-3 h-3 text-[#003580]" strokeWidth={2.5} />
      </div>
      <span className="text-[15px] text-gray-700 leading-relaxed">{text}</span>
    </div>
  )
}

function IllustrationListing() {
  return (
    <svg width="96" height="96" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="12" y="14" width="44" height="52" rx="4" fill="#d6e8ff" />
      <rect x="12" y="14" width="44" height="52" rx="4" stroke="#003580" strokeWidth="2" />
      <rect x="26" y="9" width="20" height="10" rx="3" fill="#003580" />
      <rect x="20" y="30" width="28" height="3" rx="1.5" fill="#003580" opacity=".35" />
      <rect x="20" y="38" width="20" height="3" rx="1.5" fill="#003580" opacity=".35" />
      <rect x="20" y="46" width="24" height="3" rx="1.5" fill="#003580" opacity=".35" />
      <path d="M50 54c0 0-7-4.5-7-8.5a3.5 3.5 0 0 1 7 0 3.5 3.5 0 0 1 7 0C57 49.5 50 54 50 54z" fill="#e84393" transform="scale(0.6) translate(27 35)" />
    </svg>
  )
}

function IllustrationPackages() {
  return (
    <svg width="96" height="96" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="8" y="18" width="44" height="40" rx="4" fill="#fff3d6" />
      <rect x="8" y="18" width="44" height="40" rx="4" stroke="#f5a623" strokeWidth="2" />
      <rect x="8" y="18" width="44" height="12" rx="4" fill="#f5a623" />
      <rect x="8" y="24" width="44" height="6" fill="#f5a623" />
      <rect x="18" y="12" width="4" height="10" rx="2" fill="#f5a623" />
      <rect x="38" y="12" width="4" height="10" rx="2" fill="#f5a623" />
      <rect x="16" y="36" width="6" height="6" rx="1.5" fill="#f5a623" opacity=".5" />
      <rect x="27" y="36" width="6" height="6" rx="1.5" fill="#f5a623" opacity=".5" />
      <rect x="38" y="36" width="6" height="6" rx="1.5" fill="#f5a623" opacity=".5" />
      <rect x="16" y="47" width="6" height="6" rx="1.5" fill="#f5a623" opacity=".5" />
      <rect x="27" y="47" width="6" height="6" rx="1.5" fill="#f5a623" opacity=".5" />
      <circle cx="52" cy="52" r="14" fill="#fff3d6" stroke="#f5a623" strokeWidth="2" />
      <path d="M46 52h3.5a2 2 0 1 1 0-4v4h4v-3.5a2 2 0 1 1 4 0H54v4h3.5a2 2 0 1 1 0 4H54v3.5a2 2 0 1 1-4 0V56h-4v3.5a2 2 0 1 1-4 0V56H46a2 2 0 1 1 0-4z" fill="#f5a623" />
    </svg>
  )
}

function IllustrationBookings() {
  return (
    <svg width="96" height="96" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="48" y1="48" x2="62" y2="62" stroke="#003580" strokeWidth="5" strokeLinecap="round" />
      <circle cx="30" cy="30" r="20" fill="#d6e8ff" stroke="#003580" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="6" fill="white" opacity=".5" />
      <path d="M22 30 l5 5 l9-10" stroke="#f5a623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

const COLUMNS = [
  {
    heading: 'Your gym, your rules',
    items: [
      'Set your own training packages and pricing',
      'Accept or decline bookings from your dashboard',
      'Update availability at any time, no lock-in',
    ],
  },
  {
    heading: 'Get to know your guests',
    items: [
      'Guests share their training background before they book',
      "See who's coming and plan training accordingly",
      'Build reviews from real bookings from day one',
    ],
  },
  {
    heading: 'Stay confident',
    items: [
      'Transparent payments — no hidden surprises',
      'Guest support is handled by our team',
      'Dedicated owner support when you need it',
    ],
  },
]

const TESTIMONIALS = [
  {
    quote: 'We listed our gym and had our first booking enquiry within 48 hours. The setup was straightforward and the listing looks exactly how we wanted it.',
    name: 'Jordan M.',
    gym: 'Precision MMA, Sydney',
    initials: 'JM',
    color: 'bg-[#003580]',
  },
  {
    quote: 'CombatBooking.com puts us in front of people who are actually serious about training. The quality of guest enquiries is far better than posting on social media.',
    name: 'Kru Nong',
    gym: 'Tiger Muay Thai, Phuket',
    initials: 'KN',
    color: 'bg-emerald-600',
  },
  {
    quote: 'Managing packages and availability in one place has saved us a huge amount of time. We used to handle everything over WhatsApp — this is so much cleaner.',
    name: 'Rafael S.',
    gym: 'Alliance BJJ, São Paulo',
    initials: 'RS',
    color: 'bg-rose-600',
  },
  {
    quote: 'Getting listed was genuinely simple. We had a complete profile up in under an hour, and the dashboard makes it easy to stay on top of bookings.',
    name: 'Shane D.',
    gym: 'City Boxing Club, Dublin',
    initials: 'SD',
    color: 'bg-amber-600',
  },
  {
    quote: 'Our guests come in prepared — they know the schedule, the disciplines, and the pricing before they arrive. It makes the whole experience smoother for everyone.',
    name: 'Coach Yuki',
    gym: 'Evolve Kickboxing, Tokyo',
    initials: 'CY',
    color: 'bg-violet-600',
  },
  {
    quote: "I was sceptical at first but it's been one of the best decisions for the gym. We've had international guests book directly through the platform — that never happened before.",
    name: 'Musa K.',
    gym: 'Lion Heart MMA, Dubai',
    initials: 'MK',
    color: 'bg-cyan-700',
  },
]

const FLAG_ROWS: Array<Array<{ flag: string; label: string }>> = [
  // Row 1 (10)
  [
    { flag: '🇹🇭', label: 'Thailand' },
    { flag: '🇧🇷', label: 'Brazil' },
    { flag: '🇺🇸', label: 'United States' },
    { flag: '🇬🇧', label: 'United Kingdom' },
    { flag: '🇦🇺', label: 'Australia' },
    { flag: '🇯🇵', label: 'Japan' },
    { flag: '🇰🇷', label: 'South Korea' },
    { flag: '🇸🇬', label: 'Singapore' },
    { flag: '🇫🇷', label: 'France' },
    { flag: '🇩🇪', label: 'Germany' },
  ],
  // Row 2 (11)
  [
    { flag: '🇪🇸', label: 'Spain' },
    { flag: '🇮🇹', label: 'Italy' },
    { flag: '🇵🇹', label: 'Portugal' },
    { flag: '🇳🇱', label: 'Netherlands' },
    { flag: '🇨🇦', label: 'Canada' },
    { flag: '🇲🇽', label: 'Mexico' },
    { flag: '🇦🇪', label: 'UAE' },
    { flag: '🇿🇦', label: 'South Africa' },
    { flag: '🇮🇩', label: 'Indonesia' },
    { flag: '🇲🇾', label: 'Malaysia' },
    { flag: '🇵🇭', label: 'Philippines' },
  ],
  // Row 3 (11)
  [
    { flag: '🇳🇿', label: 'New Zealand' },
    { flag: '🇸🇪', label: 'Sweden' },
    { flag: '🇩🇰', label: 'Denmark' },
    { flag: '🇫🇮', label: 'Finland' },
    { flag: '🇨🇭', label: 'Switzerland' },
    { flag: '🇧🇪', label: 'Belgium' },
    { flag: '🇮🇪', label: 'Ireland' },
    { flag: '🇬🇷', label: 'Greece' },
    { flag: '🇵🇱', label: 'Poland' },
    { flag: '🇹🇷', label: 'Turkey' },
    { flag: '🇮🇳', label: 'India' },
  ],
]

const FAQ = [
  {
    q: 'What happens if my gym is damaged by a guest?',
    a: 'Guests agree to our Terms of Use when they book, including responsibility for damage caused during their stay. If something happens, contact our support team as soon as possible with photos and details and we’ll help you work through next steps.',
  },
  {
    q: 'When will my gym go online?',
    a: 'As soon as your listing is complete. To publish, you’ll add your location, disciplines offered, at least one package with pricing, and at least one photo. Once those basics are in place, you can go live immediately.',
  },
  {
    q: 'Will I need to pay any fees during the sign-up process?',
    a: 'No. Signing up and creating your listing is free — no setup fees and no monthly cost. We only charge a small commission when you receive a confirmed booking.',
  },
]

function CtaButton({
  label,
  href,
  onClick,
  showFreeBadge = false,
  loading = false,
}: {
  label: string
  href?: string
  onClick?: () => void
  showFreeBadge?: boolean
  loading?: boolean
}) {
  const hrefRef = useRef(href)
  hrefRef.current = href

  const content = (
    <>
      <span>{loading ? 'Please wait...' : label}</span>
      {showFreeBadge && (
        <span className="inline-flex items-center rounded-md bg-[#febb02] px-2.5 py-1 text-xs font-extrabold leading-none text-[#1a1a1a]">
          Free
        </span>
      )}
    </>
  )

  if (href) {
    // Use a real button + full-page navigation so the first tap always commits (no <a> + re-render races).
    const navClass =
      'inline-flex items-center justify-center gap-3 rounded-md bg-[#006ce4] hover:bg-[#0057b8] text-white text-sm font-semibold px-6 py-3 transition-colors cursor-pointer disabled:opacity-60 disabled:pointer-events-none'
    return (
      <button
        type="button"
        className={navClass}
        onClick={(e) => {
          const target = hrefRef.current
          if (!target) return
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            window.open(target, '_blank', 'noopener,noreferrer')
            return
          }
          window.location.href = target
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-3 rounded-md bg-[#006ce4] hover:bg-[#0057b8] text-white text-sm font-semibold px-6 py-3 transition-colors"
    >
      {content}
    </button>
  )
}

export default function OwnersLandingPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [ctaLoading, setCtaLoading] = useState(false)
  /** Refined target after gym + readiness load; until then CTA uses safe default onboarding URL. */
  const [ownerResolvedHref, setOwnerResolvedHref] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const resolveOwnerDestination = async () => {
      if (!user || profile?.role !== 'owner') {
        if (!cancelled) setOwnerResolvedHref(null)
        return
      }

      try {
        const supabase = createClient()
        const { data: gym } = await supabase
          .from('gyms')
          .select('id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return

        if (!gym?.id) {
          setOwnerResolvedHref(buildOnboardingWizardUrl('step-1', null))
          return
        }

        const readinessResponse = await fetch(`/api/onboarding/readiness?gym_id=${encodeURIComponent(gym.id)}`)
        if (cancelled) return

        if (!readinessResponse.ok) {
          setOwnerResolvedHref(buildOnboardingWizardUrl('step-1', gym.id))
          return
        }

        const readiness = await readinessResponse.json()
        if (readiness?.canGoLive) {
          setOwnerResolvedHref('/manage')
        } else {
          setOwnerResolvedHref(buildOnboardingWizardUrl('step-1', gym.id))
        }
      } catch {
        if (!cancelled) setOwnerResolvedHref(buildOnboardingWizardUrl('step-1', null))
      }
    }

    if (!authLoading) {
      void resolveOwnerDestination()
    }
    return () => {
      cancelled = true
    }
  }, [authLoading, user, profile?.role])

  const ctaConfig = useMemo(() => {
    if (!user) {
      return {
        label: 'List your gym',
        href: '/auth/signup?intent=owner&redirect=/manage/list-your-gym',
      }
    }

    if (profile?.role === 'owner') {
      const ownerHref = ownerResolvedHref ?? buildOnboardingWizardUrl('step-1', null)
      const onboardingPath = ownerHref.startsWith('/manage/onboarding')
      return {
        label: onboardingPath ? 'Continue onboarding' : 'Owner dashboard',
        href: ownerHref,
      }
    }

    if (profile?.role === 'admin') {
      return {
        label: 'Admin dashboard',
        href: '/admin',
      }
    }

    return {
      label: 'Start owner onboarding',
      href: undefined,
    }
  }, [user, profile?.role, ownerResolvedHref])

  const handleNonOwnerCta = async () => {
    if (!user) {
      router.push('/auth/signin?intent=owner&redirect=/owners')
      return
    }
    if (profile?.role === 'admin') {
      router.push('/admin')
      return
    }
    setCtaLoading(true)
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const activeUser = authData.user
      if (!activeUser) {
        router.push('/auth/signin?intent=owner&redirect=/owners')
        return
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: activeUser.id,
            role: 'owner',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()

      if (upsertError) {
        router.push('/auth/signin?intent=owner&redirect=/owners')
        return
      }

      router.push('/manage/security-onboarding')
      router.refresh()
    } catch {
      router.push('/auth/signin?intent=owner&redirect=/owners')
    } finally {
      setCtaLoading(false)
    }
  }

  return (
    <div className="bg-white">

      {/* Hero — diagonal split, image runs behind sticky header */}
      <section className="bg-[#003580] text-white relative overflow-hidden -mt-16 pt-16">

        {/* Right-side image with diagonal clip — desktop only */}
        <div
          className="absolute right-0 -top-16 bottom-0 w-[52%] hidden md:block"
          style={{ clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
        >
          <img
            src="/Khun_3_c4e13bdce8_c0b7f8b5b5.avif"
            alt=""
            aria-hidden="true"
            className="w-full h-[calc(100%+4rem)] object-cover object-center"
          />
          {/* Blue tint overlay */}
          <div className="absolute inset-0 bg-[#003580]/70" />

          {/* Fine print proof points */}
          <div className="absolute bottom-6 right-6 text-right text-white/55">
            <div className="text-[12px] leading-relaxed space-y-1.5">
              {[
                'Many new listings get their first booking in the first month',
                'Hosts across 200+ countries and regions list with us',
                'Free to sign up — you only pay when you earn',
              ].map((line, idx) => (
                <div key={line} className="flex items-center justify-end gap-2">
                  <span>{line}</span>
                  <span className="inline-flex items-center gap-1">
                    {idx >= 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#febb02]/55" />}
                    {idx >= 1 && <span className="w-1.5 h-1.5 rounded-full bg-white/25" />}
                    {idx >= 2 && <span className="w-1.5 h-1.5 rounded-full bg-white/15" />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content — sits above the image */}
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-16">

            <div className="flex-1 max-w-xl md:pr-10">
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                List your{' '}
                <RotatingWord
                  words={['gym', 'stays', 'seminars', 'retreats', 'camps']}
                  intervalMs={4000}
                  className="text-white"
                />{' '}
                on
                <br className="hidden md:block" /> CombatBooking.com
              </h1>
              <p className="mt-5 text-white/75 text-base md:text-lg leading-relaxed">
                Reach fighters actively looking for their next training camp — and manage every booking from a single dashboard.
              </p>
              <div className="mt-7 md:mt-8">
                <CtaButton
                  label={ctaConfig.label}
                  href={ctaConfig.href}
                  onClick={!ctaConfig.href ? () => void handleNonOwnerCta() : undefined}
                  showFreeBadge={!user}
                  loading={ctaLoading}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* List your gym. We'll handle the rest. */}
      <section className="py-12 md:py-16 lg:py-20 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-5">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
              List your gym. We&apos;ll handle the rest.
            </h2>
            <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
              From your first listing to your hundredth booking — the tools stay simple and the experience stays yours.
            </p>
          </div>

          {/* Vertical stack (original layout) — polished type + checks */}
          <div className="mt-8 sm:mt-10 lg:mt-12 max-w-3xl space-y-8 md:space-y-10">
            {COLUMNS.map(col => (
              <div key={col.heading}>
                <div className="text-[17px] sm:text-[18px] font-extrabold text-gray-900 leading-snug">
                  {col.heading}
                </div>
                <ul className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4">
                  {col.items.map(item => (
                    <li key={item} className="flex items-start gap-3 sm:gap-4">
                      <span className="mt-0.5 flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#003580]" strokeWidth={2.5} />
                      </span>
                      <span className="text-[14px] sm:text-[15px] md:text-[16px] text-gray-800 leading-relaxed pt-0.5">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 lg:mt-12">
            <CtaButton
              label={ctaConfig.label}
              href={ctaConfig.href}
              onClick={!ctaConfig.href ? () => void handleNonOwnerCta() : undefined}
              loading={ctaLoading}
            />
          </div>
        </div>
      </section>

      {/* Grey band — splits checklist + how-it-works; matches page typography (no floating card stacks) */}
      <section className="py-14 md:py-20 bg-gray-50 border-y border-gray-100" aria-labelledby="owners-why-list">
        <div className="max-w-6xl mx-auto px-4">
          <h2 id="owners-why-list" className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Built for owners who want bookings, not admin overhead
          </h2>
          <p className="mt-4 text-gray-500 text-base md:text-lg leading-relaxed max-w-xl">
            List once and reach guests who are already searching for camps, train & stays, and seminars — not random browsers.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 divide-y divide-gray-200/80 md:divide-y-0 md:divide-x md:divide-gray-200/90">
            {[
              {
                title: 'Free to list',
                body: 'No setup fees or monthly lock-in — you only earn when guests book.',
              },
              {
                title: 'Serious guests',
                body: 'Travellers on CombatBooking.com are looking for training, not generic holidays.',
              },
              {
                title: 'You stay in control',
                body: 'Set packages, availability, and pricing from one dashboard — update anytime.',
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="py-8 md:py-0 md:px-8 md:first:pl-0 md:last:pr-0"
              >
                <div className="text-[17px] font-bold text-gray-900">{title}</div>
                <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple to begin */}
      <section id="how-it-works" className="py-14 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Simple to begin and stay ahead</h2>
          <p className="mt-4 text-gray-500 text-base md:text-lg leading-relaxed max-w-xl">
            Set up your listing in minutes. Everything you need to start getting bookings is built in.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <IllustrationListing />
              <div className="mt-5 text-[17px] font-bold text-gray-900">Create your listing</div>
              <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">
                Add your gym details, disciplines, facilities, and photos. Your listing goes live as soon as you&apos;re ready.
              </p>
            </div>
            <div>
              <IllustrationPackages />
              <div className="mt-5 text-[17px] font-bold text-gray-900">Set packages and availability</div>
              <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">
                Guests see exactly what they&apos;re booking — reducing back-and-forth and increasing commitment.
              </p>
            </div>
            <div>
              <IllustrationBookings />
              <div className="mt-5 text-[17px] font-bold text-gray-900">Receive and manage bookings</div>
              <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">
                Confirm bookings from your dashboard. Stay organised and keep guests informed.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <CtaButton
              label={ctaConfig.label}
              href={ctaConfig.href}
              onClick={!ctaConfig.href ? () => void handleNonOwnerCta() : undefined}
              loading={ctaLoading}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 md:py-20 bg-white border-b border-gray-100 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover opacity-[0.28] pointer-events-none select-none"
          style={{ backgroundImage: "url('/highquality-world-map-vector-art_1112614-9909.jpg')" }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Reach a growing audience of serious fighters
          </h2>
          <p className="mt-4 text-gray-500 text-base md:text-lg leading-relaxed max-w-xl">
            Guests on CombatBooking.com are looking for exactly what you offer. They&apos;re not browsing — they&apos;re ready to train.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <div className="text-5xl md:text-6xl font-extrabold text-gray-900">100%</div>
              <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
                of guests are specifically searching for combat sports training
              </p>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-extrabold text-gray-900">Free</div>
              <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
                to list — no monthly fees, no setup cost, no lock-in contracts
              </p>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-extrabold text-gray-900">1 place</div>
              <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
                to manage your availability, packages, and bookings
              </p>
            </div>
          </div>

          <div className="mt-12">
            <CtaButton
              label={ctaConfig.label}
              href={ctaConfig.href}
              onClick={!ctaConfig.href ? () => void handleNonOwnerCta() : undefined}
              loading={ctaLoading}
            />
          </div>
        </div>
      </section>

      {/* Countries & Regions */}
      <section className="py-14 md:py-20 bg-gray-50 border-b border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
          {/* Title */}
          <div className="px-4 md:pl-[max(1rem,calc((100vw-72rem)/2+1rem))] flex-shrink-0">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-snug whitespace-nowrap">
              30+ countries and regions
            </h2>
            <p className="mt-3 text-base md:text-lg text-gray-500 whitespace-nowrap">
              Our guests search from every corner of the world.
            </p>
          </div>

          {/* Flags */}
          <div className="flex-1 px-4 md:pl-6 md:pr-0">
            {/* Mobile: 2 rows of 8, using flagcdn images */}
            <div className="flex flex-col gap-2 md:hidden">
              {FLAG_ROWS.slice(0, 2).map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-2">
                  {row.slice(0, 8).map(({ label }) => {
                    const code = {
                      Thailand: 'th', Brazil: 'br', 'United States': 'us', 'United Kingdom': 'gb',
                      Australia: 'au', Japan: 'jp', 'South Korea': 'kr', Singapore: 'sg',
                      France: 'fr', Germany: 'de', Spain: 'es', Italy: 'it',
                      Portugal: 'pt', Netherlands: 'nl', Canada: 'ca', Mexico: 'mx',
                    }[label] || label.toLowerCase().slice(0, 2)
                    return (
                      <div
                        key={label}
                        title={label}
                        className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm flex-shrink-0"
                      >
                        <img
                          src={`https://flagcdn.com/${code}.svg`}
                          alt={label}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Desktop: all 3 rows, emoji style */}
            <div className="hidden md:block">
              <div className="space-y-0.5">
                {FLAG_ROWS.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex justify-center gap-0.5">
                    {row.map(({ flag, label }) => (
                      <div
                        key={label}
                        title={label}
                        className="w-[72px] h-[72px] rounded-full bg-white border border-gray-100 flex items-center justify-center text-4xl shadow-sm select-none"
                      >
                        {flag}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 md:py-20 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">What gym owners have to say</h2>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div
                key={t.name}
                className="flex flex-col justify-between rounded-xl border border-[#febb02] bg-white p-5"
              >
                <p className="text-[15px] text-gray-700 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.gym}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <CtaButton
              label={ctaConfig.label}
              href={ctaConfig.href}
              onClick={!ctaConfig.href ? () => void handleNonOwnerCta() : undefined}
              loading={ctaLoading}
            />
          </div>
        </div>
      </section>

      {/* FAQ — white so the global grey footer reads as one clear band (no double-grey with FAQ) */}
      <section id="faq" className="py-14 md:py-20 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Your questions answered</h2>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-14">
            {FAQ.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[15px] text-gray-500">
              Still have questions?{' '}
              <Link href="/contact" className="text-[#003580] font-medium hover:underline">
                Contact our team
              </Link>
              {' '}and we&apos;ll get back to you quickly.
            </p>
            <CtaButton
              label={ctaConfig.label}
              href={ctaConfig.href}
              onClick={!ctaConfig.href ? () => void handleNonOwnerCta() : undefined}
              loading={ctaLoading}
            />
          </div>
        </div>
      </section>

    </div>
  )
}
