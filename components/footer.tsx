'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCurrency } from '@/lib/contexts/currency-context'
import { CurrencyModal } from '@/components/currency-modal'

export function Footer() {
  const { selectedCurrency } = useCurrency()
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)

  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-6">
          {/* Customer Care */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Customer Care</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/bookings" className="text-gray-600 hover:text-[#003580]">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-[#003580]">
                  Get Support
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-[#003580]">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-gray-600 hover:text-[#003580]">
                  Browse Gyms
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="text-gray-600 hover:text-[#003580]">
                  Top Locations
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-[#003580]">
                  Training Guides
                </Link>
              </li>
              <li>
                <Link href="/auth/signup?intent=owner" className="text-gray-600 hover:text-[#003580]">
                  Add Your Gym
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-[#003580]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-[#003580]">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-gray-600 hover:text-[#003580]">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>

          {/* For Gyms */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Gyms</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/manage" className="text-gray-600 hover:text-[#003580]">
                  Owner Portal
                </Link>
              </li>
              <li>
                <Link href="/manage/onboarding" className="text-gray-600 hover:text-[#003580]">
                  Register Gym
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="text-gray-600 hover:text-[#003580]">
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-[#003580]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-[#003580]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-600 hover:text-[#003580]">
                  Join Our Team
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-gray-600 hover:text-[#003580]">
                  Media Kit
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Partner Logos */}
        <div className="pt-8 pb-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-10">
            <img
              src="/logo-board-of-boxing.png"
              alt="Board of Boxing"
              className="h-12 w-auto object-contain transition-all"
              style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)', opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            />
            <img
              src="/logo-gov-new.png"
              alt="Government"
              className="h-12 w-auto object-contain transition-all"
              style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)', opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            />
            <img
              src="/logo-muaythaicenter.webp"
              alt="Muay Thai Center"
              className="h-12 w-auto object-contain transition-all"
              style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)', opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            />
            <img
              src="/logo-oranization-amazing-thailand.png"
              alt="Amazing Thailand"
              className="h-12 w-auto object-contain transition-all"
              style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)', opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            />
            <img
              src="/logo-oranization-first-league.png"
              alt="First League"
              className="h-12 w-auto object-contain transition-all"
              style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)', opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            />
            <img
              src="/logo-oranization-nia.png"
              alt="NIA"
              className="h-12 w-auto object-contain transition-all"
              style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)', opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            />
            <img
              src="/logo-oranization-sat.png"
              alt="SAT"
              className="h-12 w-auto object-contain transition-all"
              style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)', opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            />
          </div>
        </div>

        {/* Currency Selector */}
        <div className="border-t pt-6">
          <button
            onClick={() => setCurrencyModalOpen(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#003580] transition-colors"
          >
            <span className="font-medium">{selectedCurrency}</span>
          </button>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-xs text-gray-600">
            Copyright © 2026 CombatBooking.com™. All rights reserved.
          </p>
        </div>
      </div>

      <CurrencyModal open={currencyModalOpen} onOpenChange={setCurrencyModalOpen} />
    </footer>
  )
}
