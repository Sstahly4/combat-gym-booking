'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/lib/contexts/currency-context'
import { CurrencyModal } from '@/components/currency-modal'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const { selectedCurrency } = useCurrency()
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-[#003580] text-white">
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

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 space-y-2">
            {user ? (
              <>
                {/* Admin Links - Mobile */}
                {profile?.role === 'admin' && (
                  <>
                    <Link 
                      href="/admin" 
                      className="block px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                    <Link 
                      href="/admin/gyms" 
                      className="block px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Gyms
                    </Link>
                  </>
                )}
                
                {/* Owner Dashboard */}
                {profile?.role === 'owner' && (
                  <Link 
                    href="/manage" 
                    className="block px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}

                {/* List Your Gym */}
                {profile?.role !== 'owner' && (
                  <Link 
                    href={user ? "/manage/onboarding" : "/auth/signup?intent=owner"}
                    className="block px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    List your gym
                  </Link>
                )}

                {/* My Bookings */}
                <Link 
                  href="/bookings" 
                  className="block px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
                
                <button 
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/signup?intent=owner"
                  className="block px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  List your gym
                </Link>
                <Link 
                  href="/auth/signup"
                  className="block px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
                <Link 
                  href="/auth/signin"
                  className="block px-4 py-2 text-sm hover:bg-white/10 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        )}
      </div>
      <CurrencyModal open={currencyModalOpen} onOpenChange={setCurrencyModalOpen} />
    </nav>
  )
}
