'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useCurrency, CURRENCIES } from '@/lib/contexts/currency-context'
import { CurrencyModal } from '@/components/currency-modal'
import { Menu, X, Globe, Settings, HelpCircle, FileText, Building2, Info } from 'lucide-react'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const { selectedCurrency } = useCurrency()
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get currency name
  const currencyName = CURRENCIES.find(c => c.code === selectedCurrency)?.name || selectedCurrency

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#003580] text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight">
            CombatBooking.com
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {/* Currency Selector */}
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white text-sm font-medium"
              onClick={() => setCurrencyModalOpen(true)}
            >
              {selectedCurrency}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                {/* Admin Links - Desktop */}
                {profile?.role === 'admin' && (
                  <>
                    <Link href="/admin">
                      <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-sm">
                        Admin
                      </Button>
                    </Link>
                    <Link href="/admin/gyms">
                      <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-sm">
                        Gyms
                      </Button>
                    </Link>
                  </>
                )}
                
                {/* Owner Dashboard */}
                {profile?.role === 'owner' && (
                  <Link href="/manage">
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-sm">
                      Dashboard
                    </Button>
                  </Link>
                )}

                {/* List Your Gym - Show for non-owners (fighters and admins who aren't owners) */}
                {profile?.role !== 'owner' && (
                  <Link href={user ? "/manage/onboarding" : "/auth/signup?intent=owner"}>
                    <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-sm">
                      List your gym
                    </Button>
                  </Link>
                )}

                {/* My Bookings - available for all logged in users */}
                <Link href="/bookings">
                  <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-sm">
                    My Bookings
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10 hover:text-white text-sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Signed Out Users */}
                <Link href="/auth/signup?intent=owner">
                  <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-sm font-medium">
                    List your gym
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="secondary" className="bg-white text-[#003580] hover:bg-gray-100 text-sm font-medium">
                    Register
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-sm font-medium">
                    Sign in
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {/* Currency Selector - Mobile */}
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white text-xs font-medium px-2"
              onClick={() => setCurrencyModalOpen(true)}
            >
              {selectedCurrency}
            </Button>

            {/* Hamburger Menu Button */}
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
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
                  {/* Currency Selector */}
                  <button
                    onClick={() => {
                      setCurrencyModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-[#003580]">{selectedCurrency}</span>
                      </div>
                      <div className="text-sm text-gray-900">
                        {selectedCurrency} {currencyName}
                      </div>
                    </div>
                  </button>

                  {/* Language Selector */}
                  <button
                    onClick={() => {
                      // Placeholder for language selector
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <img
                          src="/flags/gb.svg"
                          alt="United Kingdom"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-sm text-gray-900">English (UK)</div>
                    </div>
                  </button>

                  {/* List Your Gym */}
                  <Link
                    href={user ? "/manage/onboarding" : "/auth/signup?intent=owner"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="text-sm text-gray-900">List your gym</div>
                    </div>
                  </Link>

                  {/* Divider */}
                  <div className="h-px bg-gray-200 my-2" />

                  {/* Help and support Section */}
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
      <CurrencyModal open={currencyModalOpen} onOpenChange={setCurrencyModalOpen} />
    </nav>
  )
}
