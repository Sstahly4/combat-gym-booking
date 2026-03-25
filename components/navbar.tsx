'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from 'next/navigation'
import { useCurrency, CURRENCIES, LANGUAGES } from '@/lib/contexts/currency-context'
import { CurrencyModal } from '@/components/currency-modal'
import { Menu, X, Globe, Settings, HelpCircle, FileText, Building2, Info, Heart } from 'lucide-react'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { selectedCurrency, selectedLanguage } = useCurrency()
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [currencyModalTab, setCurrencyModalTab] = useState<'language' | 'currency'>('language')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const desktopMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setDesktopMenuOpen(false)
      }
    }
    if (desktopMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [desktopMenuOpen])

  const currencyName = CURRENCIES.find(c => c.code === selectedCurrency)?.name || selectedCurrency
  const selectedLanguageItem = LANGUAGES.find(l => l.code === selectedLanguage)
  const languageName = selectedLanguageItem
    ? `${selectedLanguageItem.name} (${selectedLanguageItem.region})`
    : 'English (United Kingdom)'

  const countryCode = (selectedLanguage?.split('-')[1] || '').toLowerCase()
  const flagSrc = countryCode ? `https://flagcdn.com/${countryCode}.svg` : null
  const flagPng1x = countryCode ? `https://flagcdn.com/w40/${countryCode}.png` : null
  const flagPng2x = countryCode ? `https://flagcdn.com/w80/${countryCode}.png` : null

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const isOwnersPage = pathname === '/owners'
  const ownersAwarePartnerLabel = isOwnersPage ? 'Already a partner' : 'List your gym'
  const ownersAwarePartnerHref = isOwnersPage
    ? (user ? '/manage' : '/auth/signin?intent=partner&redirect=/manage')
    : (user ? '/manage/onboarding' : '/owners')

  return (
    <>
    {isOwnersPage && <div className="h-16" aria-hidden="true" />}
    <div className={`${isOwnersPage ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-50`}>
    <nav className={isOwnersPage ? 'bg-transparent' : 'bg-[#003580]'}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight text-white">
              CombatBooking.com
            </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* List your gym */}
            <Link href={ownersAwarePartnerHref}>
              <button className="px-3 py-2 rounded-full text-sm font-medium text-white/90 hover:bg-white/10 transition-colors">
                {ownersAwarePartnerLabel}
              </button>
            </Link>

            {/* Globe / Language + Currency */}
            <button
              type="button"
              className="p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors"
              onClick={() => {
                setCurrencyModalTab('language')
                setCurrencyModalOpen(true)
              }}
              aria-label="Language and currency"
            >
              <Globe className="w-5 h-5" />
            </button>

            {/* Sandwich button + dropdown */}
            <div className="relative" ref={desktopMenuRef}>
              <button
                type="button"
                onClick={() => setDesktopMenuOpen(v => !v)}
                className="flex items-center p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-white/90" />
              </button>

              {desktopMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] py-1">

                  {/* Help Centre */}
                  <Link
                    href="/faq"
                    onClick={() => setDesktopMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">Help Centre</span>
                  </Link>

                  <div className="h-px bg-gray-100 mx-2" />

                  {/* List your gym — featured row */}
                  <Link
                    href={user ? "/manage/onboarding" : "/owners"}
                    onClick={() => setDesktopMenuOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">List your gym</div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-snug">Start earning by listing your combat sports gym.</div>
                    </div>
                    <img
                      src="/ChatGPT Image Mar 18, 2026 at 05_02_15 PM.png"
                      alt=""
                      aria-hidden
                      className="w-10 h-10 object-contain flex-shrink-0"
                    />
                  </Link>

                  <div className="h-px bg-gray-100 mx-2" />

                  {/* Find Bookings */}
                  <Link
                    href="/bookings"
                    onClick={() => setDesktopMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    Find Bookings
                  </Link>

                  {/* Saved Gyms */}
                  <Link
                    href="/saved"
                    onClick={() => setDesktopMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    Saved Gyms
                  </Link>

                  {/* Customer support */}
                  <Link
                    href="/contact"
                    onClick={() => setDesktopMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    Customer support
                  </Link>

                  {/* Admin links when applicable */}
                  {user && profile?.role === 'admin' && (
                    <>
                      <div className="h-px bg-gray-100 mx-2" />
                      <Link href="/admin" onClick={() => setDesktopMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </>
                  )}

                  {user && profile?.role === 'owner' && (
                    <>
                      <div className="h-px bg-gray-100 mx-2" />
                      <Link href="/manage" onClick={() => setDesktopMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span>Gym Dashboard</span>
                      </Link>
                    </>
                  )}

                  <div className="h-px bg-gray-100 mx-2" />

                  {/* Sign in / Sign up OR Sign out */}
                  {user ? (
                    <button
                      type="button"
                      onClick={() => { handleSignOut(); setDesktopMenuOpen(false) }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      Sign out
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/auth/signin"
                        onClick={() => setDesktopMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        Log in or sign up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-1">
            {/* Globe / Language + Currency - Mobile */}
            <button
              type="button"
              className="p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors"
              onClick={() => {
                setCurrencyModalTab('language')
                setCurrencyModalOpen(true)
              }}
              aria-label="Language and currency"
            >
              <Globe className="w-5 h-5" />
            </button>

            {/* Hamburger Menu Button */}
            <button
              type="button"
              className="p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          </div>

        {/* Mobile Menu - Bottom Sheet */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Bottom Sheet - Same size as date picker */}
            <div className="fixed inset-x-0 bottom-0 z-[60] md:hidden animate-slide-up bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 pointer-events-auto">
              {/* Header - Same as date picker */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Menu</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                  aria-label="Close"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Scrollable Content - Same as date picker */}
              <div className="px-4 pb-4 max-h-[72vh] overflow-y-auto">
                <div className="pt-3 space-y-0">
                  {/* Language + Currency Selector */}
                  <button
                    onClick={() => {
                      setCurrencyModalTab('language')
                      setCurrencyModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {flagSrc ? (
                          <img
                            src={flagSrc}
                            srcSet={
                              flagPng1x && flagPng2x
                                ? `${flagPng1x} 1x, ${flagPng2x} 2x`
                                : undefined
                            }
                            alt=""
                            aria-hidden
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Globe className="w-5 h-5 text-[#003580]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Language &amp; currency
                        </div>
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {languageName} · {selectedCurrency} {currencyName}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-gray-200 my-2" />

                  {/* List your gym — featured section */}
                  <div className="pt-2">
                    <Link
                      href={user ? "/manage/onboarding" : "/owners"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between gap-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl px-2 touch-manipulation"
                    >
                      <div>
                        <div className="text-[15px] font-semibold text-gray-900">List your gym</div>
                        <div className="text-[13px] text-gray-500 mt-1 leading-snug">
                          Start earning by listing your combat sports gym.
                        </div>
                      </div>
                      <img
                        src="/ChatGPT Image Mar 18, 2026 at 05_02_15 PM.png"
                        alt=""
                        aria-hidden
                        className="w-14 h-14 object-contain flex-shrink-0"
                      />
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-200 my-2" />

                  {/* Settings and legal Section */}
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-0">Settings and legal</div>
                    
                    {/* Settings - Only for signed-in users */}
                    {user && (
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Settings className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="text-sm text-gray-900">Settings</div>
                        </div>
                      </Link>
                    )}

                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Info className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="text-sm text-gray-900">About CombatBooking.com</div>
                      </div>
                    </Link>

                    <Link
                      href="/terms"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="text-sm text-gray-900">Terms & Conditions</div>
                      </div>
                    </Link>

                    <Link
                      href="/privacy"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="text-sm text-gray-900">Privacy Policy</div>
                      </div>
                    </Link>

                    <Link
                      href="/cookies"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="text-sm text-gray-900">Cookie Policy</div>
                      </div>
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-200 my-2" />

                  {/* Help and support Section (moved to bottom, below Cookie Policy) */}
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-0">Help and support</div>
                    <Link
                      href="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="text-sm text-gray-900">Contact Customer Service</div>
                      </div>
                    </Link>
                  </div>

                  {/* User Account Section - Only for signed-in users */}
                  {user && (
                    <>
                      <div className="h-px bg-gray-200 my-2" />
                      <div className="pt-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-0">Account</div>
                        {/* Admin Links */}
                        {profile?.role === 'admin' && (
                          <>
                            <Link
                              href="/admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Settings className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="text-sm text-gray-900">Admin Dashboard</div>
                              </div>
                            </Link>
                            <Link
                              href="/admin/gyms"
                              onClick={() => setMobileMenuOpen(false)}
                              className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="text-sm text-gray-900">All Gyms</div>
                              </div>
                            </Link>
                          </>
                        )}

                        {/* Owner Dashboard */}
                        {profile?.role === 'owner' && (
                          <Link
                            href="/manage"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Settings className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="text-sm text-gray-900">Dashboard</div>
                            </div>
                          </Link>
                        )}

                        {/* My Bookings */}
                        <Link
                          href="/bookings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="text-sm text-gray-900">My Bookings</div>
                          </div>
                        </Link>

                        {/* Saved Gyms */}
                        <Link
                          href="/saved"
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Heart className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="text-sm text-gray-900">Saved Gyms</div>
                          </div>
                        </Link>

                        {/* Sign Out */}
                        <button
                          onClick={() => {
                            handleSignOut()
                            setMobileMenuOpen(false)
                          }}
                          className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <X className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="text-sm text-gray-900">Sign Out</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Sign In / Register - Only for signed-out users */}
                  {!user && (
                    <>
                      <div className="h-px bg-gray-200 my-2" />
                      <div className="pt-2 space-y-2">
                        <Link
                          href="/auth/signin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center px-4 py-3 bg-[#003580] text-white rounded-lg font-medium hover:bg-[#003580]/90 transition-colors"
                        >
                          Sign in
                        </Link>
                        <Link
                          href="/auth/signup"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center px-4 py-3 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                          Register
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
    </div>
    <CurrencyModal
      open={currencyModalOpen}
      onOpenChange={setCurrencyModalOpen}
      initialTab={currencyModalTab}
    />
    </>
  )
}
