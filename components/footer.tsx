'use client'

import Link from 'next/link'
import { useState } from 'react'
import { DollarSign, Globe } from 'lucide-react'
import { useCurrency, LANGUAGES } from '@/lib/contexts/currency-context'
import { CurrencyModal } from '@/components/currency-modal'

const FOOTER_SECTIONS = [
  {
    title: 'Customer Care',
    links: [
      { href: '/bookings', label: 'My Bookings' },
      { href: '/contact', label: 'Customer service' },
      { href: '/faq', label: 'Help Center' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { href: '/search', label: 'Browse Gyms' },
      { href: '/destinations', label: 'Top Locations' },
      { href: '/blog', label: 'Training Guides' },
      { href: '/owners', label: 'Add Your Gym' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms & Conditions' },
      { href: '/accessibility', label: 'Accessibility' },
    ],
  },
  {
    title: 'For Gyms',
    links: [
      { href: '/manage', label: 'Partner Hub' },
      { href: '/owners', label: 'Register Gym' },
      { href: '/affiliate', label: 'Affiliate Program' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/careers', label: 'Join Our Team' },
      { href: '/press', label: 'Media Kit' },
    ],
  },
] as const

const SOCIAL_LINKS = [
  {
    href: 'https://www.facebook.com/profile.php?id=61590281596581',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58-.001-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
      </svg>
    ),
  },
  {
    href: 'https://x.com/combatstay',
    label: 'X',
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z" />
      </svg>
    ),
  },
  {
    href: 'https://www.instagram.com/combatstay/',
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
      </svg>
    ),
  },
] as const

const PARTNER_LOGOS = [
  { src: '/logo-board-of-boxing.webp', alt: 'Board of Boxing' },
  { src: '/logo-gov-new.webp', alt: 'Government' },
  { src: '/logo-muaythaicenter.webp', alt: 'Muay Thai Center' },
  { src: '/logo-oranization-amazing-thailand.png', alt: 'Amazing Thailand' },
  { src: '/logo-oranization-first-league.png', alt: 'First League' },
  { src: '/logo-oranization-nia.png', alt: 'NIA' },
  { src: '/logo-oranization-sat.png', alt: 'SAT' },
] as const

function formatFooterLanguage(code: string): string {
  const item = LANGUAGES.find((language) => language.code === code)
  if (!item) return 'English (GB)'
  const abbr = code.includes('-') ? code.split('-')[1]! : item.region.slice(0, 2).toUpperCase()
  return `${item.name} (${abbr})`
}

const footerLinkClass =
  'text-sm text-gray-600 underline-offset-2 transition-colors hover:text-gray-900 hover:underline'

export function Footer() {
  const { selectedCurrency, selectedLanguage } = useCurrency()
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [currencyModalTab, setCurrencyModalTab] = useState<'language' | 'currency'>('language')

  const openLanguageModal = () => {
    setCurrencyModalTab('language')
    setCurrencyModalOpen(true)
  }

  const openCurrencyModal = () => {
    setCurrencyModalTab('currency')
    setCurrencyModalOpen(true)
  }

  return (
    <footer className="mt-auto bg-[#f7f7f7] md:border-t md:bg-gray-50">
      {/* ── Mobile: Airbnb-style stacked sections ── */}
      <div className="px-6 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] pt-6 md:hidden">
        {FOOTER_SECTIONS.map((section, index) => (
          <div
            key={section.title}
            className={index > 0 ? 'mt-5 border-t border-gray-200/50 pt-5' : undefined}
          >
            <h3 className="mb-2.5 text-[15px] font-semibold tracking-tight text-gray-800">
              {section.title}
            </h3>
            <ul className="space-y-2.5">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-5 space-y-3 border-t border-gray-200/50 pt-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <button
              type="button"
              onClick={openLanguageModal}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
            >
              <Globe className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
              {formatFooterLanguage(selectedLanguage)}
            </button>
            <button
              type="button"
              onClick={openCurrencyModal}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
            >
              <DollarSign className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
              {selectedCurrency}
            </button>
          </div>

          <div className="flex items-center gap-3.5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-gray-600 transition-opacity hover:text-gray-900 hover:opacity-80"
              >
                {social.icon}
              </a>
            ))}
          </div>

          <p className="text-sm text-gray-600">© 2026 CombatStay, Inc.</p>

          <p className="text-sm text-gray-600">
            <Link href="/privacy" className="underline-offset-2 hover:text-gray-900 hover:underline">
              Privacy
            </Link>
            <span className="mx-1.5" aria-hidden>
              ·
            </span>
            <Link href="/terms" className="underline-offset-2 hover:text-gray-900 hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </div>

      {/* ── Desktop: existing multi-column layout ── */}
      <div className="mx-auto hidden max-w-6xl px-4 py-10 md:block">
        <div className="mb-6 grid grid-cols-2 gap-8 md:grid-cols-5">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-semibold text-gray-900">{section.title}</h3>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-600 hover:text-[#003580]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pb-6 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-10">
            {PARTNER_LOGOS.map((logo) => (
              <img
                key={logo.src}
                src={logo.src}
                alt={logo.alt}
                className="h-12 w-auto object-contain opacity-80 transition-all"
                style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
              />
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <button
            type="button"
            onClick={openCurrencyModal}
            className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#003580]"
          >
            <span className="font-medium">{selectedCurrency}</span>
          </button>
        </div>
      </div>

      <div className="hidden border-t bg-white md:block">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <p className="text-xs text-gray-600">
            Copyright © 2026 CombatStay.com™. All rights reserved.
          </p>
        </div>
      </div>

      <CurrencyModal
        open={currencyModalOpen}
        onOpenChange={setCurrencyModalOpen}
        initialTab={currencyModalTab}
      />
    </footer>
  )
}
