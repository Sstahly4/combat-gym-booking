'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import { useCurrency, CURRENCIES, LANGUAGES } from '@/lib/contexts/currency-context'
import { CurrencyModal } from '@/components/currency-modal'
import {
  Menu,
  X,
  Bell,
  Globe,
  Settings,
  FileText,
  Building2,
  Info,
  LayoutDashboard,
} from 'lucide-react'
import { ManageHeaderSearch } from '@/components/manage/manage-header-search'
import { AdminHeaderSearch } from '@/components/admin/admin-header-search'
import { NotificationBell } from '@/components/manage/notification-bell'
import { isManageGymOnboardingNavLocked } from '@/lib/manage/manage-onboarding-nav-lock'
import { useOwnerOnboardingStatus } from '@/lib/hooks/use-owner-onboarding-status'

/** Anchor for the “Needs your response” block on the owner bookings page. */
const OWNER_INQUIRIES_HREF = '/manage/bookings#book-needs-your-response'

/** Plain sandwich-menu row (matches “Customer service” — text only, one weight). */
const menuPlainClass =
  'flex items-center px-4 py-3 text-sm font-normal text-gray-800 hover:bg-gray-50 transition-colors'
const menuPlainBetweenClass =
  'flex items-center justify-between gap-2 px-4 py-3 text-sm font-normal text-gray-800 hover:bg-gray-50 transition-colors'

function AdminNotificationBell() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        aria-label="Admin notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[110] mt-2 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-semibold text-stone-900">Admin notifications</p>
            <p className="mt-0.5 text-[11px] text-stone-500">Coming soon.</p>
          </div>
          <div className="px-4 py-8 text-center text-sm text-stone-500">
            We’ll add admin alerts here once we decide what to notify staff about.
          </div>
          <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-2 text-right">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="text-[11px] font-medium text-stone-500 hover:text-stone-700"
            >
              Admin Hub
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

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
  /** Owner identity (email-verified partner). True even before onboarding completes. */
  const isOwnerIdentity = Boolean(user && profile?.role === 'owner')
  const ownerOnboarding = useOwnerOnboardingStatus()
  /**
   * Capability-gated owner: only treat as a "real" partner for navigation/menu
   * purposes once they have a listing draft (industry-standard OTA pattern —
   * Booking.com / Airbnb / Stripe Connect all hide the dashboard until the
   * partner has completed at least the first onboarding step).
   */
  const isOwner = isOwnerIdentity && ownerOnboarding.stage === 'active'
  /** Email-verified partner who hasn't created their listing yet. */
  const isOwnerPending = isOwnerIdentity && ownerOnboarding.stage === 'pending'
  const isAdmin = Boolean(user && profile?.role === 'admin')
  const isManageOwnerShell =
    Boolean(isOwnerIdentity && pathname && pathname.startsWith('/manage'))
  /** Admin Hub shell — same tall layout as Partner Hub but for `/admin/*`. */
  const isAdminShell =
    Boolean(isAdmin && pathname && pathname.startsWith('/admin'))
  /** Block dashboard / header search shortcuts while finishing gym onboarding. */
  const ownerOnboardingNavLock =
    Boolean(isOwnerIdentity && pathname && isManageGymOnboardingNavLocked(pathname)) ||
    isOwnerPending
  const ownersAwarePartnerLabel = isOwnersPage ? 'Already a partner' : 'List your gym'
  const ownersAwarePartnerHref = isOwnersPage
    ? (user
        ? (profile?.role === 'owner' ? '/manage' : '/owners')
        : '/auth/signin?intent=partner&redirect=/manage')
    : '/owners'

  /** Signed-in gym owners: primary CTA is the owner dashboard, not “List your gym”. */
  const topPartnerHref = isOwner && !isOwnersPage ? '/manage' : ownersAwarePartnerHref
  const topPartnerLabel =
    isOwner && !isOwnersPage ? 'Dashboard' : ownersAwarePartnerLabel
  const showOwnerDashboardIcon = isOwner && topPartnerHref === '/manage'

  /**
   * - Pending owner (verified email, no listing yet): "Finish your listing" → onboarding wizard.
   * - Owner mid-onboarding inside `/manage/*`: same as above.
   * - Otherwise: defer to the standard partner CTA / dashboard logic.
   */
  const navPartnerHref = isOwnerPending
    ? ownerOnboarding.nextStepHref
    : ownerOnboardingNavLock
      ? '/owners'
      : topPartnerHref
  const navPartnerLabel = isOwnerPending
    ? 'Finish your listing'
    : ownerOnboardingNavLock
      ? 'List your gym'
      : topPartnerLabel
  const navPartnerShowDashboardIcon =
    showOwnerDashboardIcon && !ownerOnboardingNavLock && !isOwnerPending

  const [ownerPendingCount, setOwnerPendingCount] = useState<number | null>(null)
  useEffect(() => {
    if (!isOwner || !user?.id) {
      setOwnerPendingCount(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: gyms } = await supabase.from('gyms').select('id').eq('owner_id', user.id)
      const ids = (gyms || []).map((g) => g.id)
      if (ids.length === 0) {
        if (!cancelled) setOwnerPendingCount(0)
        return
      }
      const { count, error } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .in('gym_id', ids)
        .eq('status', 'pending')
      if (!cancelled) setOwnerPendingCount(error ? null : count ?? 0)
    })()
    return () => {
      cancelled = true
    }
  }, [isOwner, user?.id])

  return (
    <>
    {isOwnersPage && <div className="h-16" aria-hidden="true" />}
    <div className={`${isOwnersPage ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-50`}>
    <nav className={isOwnersPage ? 'bg-transparent' : 'bg-[#003580]'}>
      <div className="max-w-6xl mx-auto px-4">
        <div
          className={`flex min-w-0 items-center justify-between gap-2 md:gap-3 ${
            isManageOwnerShell || isAdminShell ? 'min-h-[5rem] py-2' : 'h-16'
          }`}
        >
            {isManageOwnerShell || isAdminShell ? (
              <Link
                href={isAdminShell ? '/admin' : '/'}
                className="shrink-0 rounded-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <span className="block truncate text-left text-lg font-bold leading-snug tracking-tight text-white sm:text-xl md:text-2xl">
                  CombatStay.com
                </span>
                <span className="mt-0.5 block translate-x-px text-left text-base font-light leading-tight tracking-tight text-white sm:text-lg md:text-xl">
                  {isAdminShell ? 'Admin Hub' : 'Partner Hub'}
                </span>
              </Link>
            ) : (
              <Link
                href="/"
                className="shrink-0 truncate text-lg font-bold tracking-tight text-white sm:text-xl md:text-2xl"
              >
                CombatStay.com
              </Link>
            )}

          {/* Desktop Navigation — sit above page content that also uses z-50 (e.g. search popovers) */}
          <div className="relative z-[100] hidden shrink-0 items-center gap-1.5 md:flex">
            {isManageOwnerShell && !ownerOnboardingNavLock ? <ManageHeaderSearch /> : null}
            {isAdminShell ? <AdminHeaderSearch /> : null}

            {/* Partner CTA: list gym (visitors / owners in onboarding) or dashboard (signed-in owners) */}
            <Link
              href={navPartnerHref}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              {navPartnerShowDashboardIcon ? (
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-95" strokeWidth={1.75} aria-hidden />
              ) : null}
              <span>{navPartnerLabel}</span>
            </Link>

            {/* Notification bells (owners + admins only; never for travelers) */}
            {isOwner && !ownerOnboardingNavLock ? <NotificationBell /> : null}
            {isAdmin ? <AdminNotificationBell /> : null}

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
                onClick={() => setDesktopMenuOpen((v) => !v)}
                className="flex items-center p-2 rounded-full hover:bg-white/10 transition-colors touch-manipulation"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-white/90" />
              </button>

              {desktopMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] py-1">

                  {/* Featured row — pending owners get "Finish your listing", guests get "List your gym" */}
                  {!isOwner || ownerOnboardingNavLock ? (
                    <>
                      <Link
                        href={isOwnerPending ? ownerOnboarding.nextStepHref : '/owners'}
                        onClick={() => setDesktopMenuOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {isOwnerPending ? 'Finish your listing' : 'List your gym'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                            {isOwnerPending
                              ? 'Complete a few short steps to start accepting bookings.'
                              : 'Start earning by listing your combat sports gym.'}
                          </div>
                        </div>
                        <img
                          src="/ChatGPT Image Mar 18, 2026 at 05_02_15 PM.png"
                          alt=""
                          aria-hidden
                          className="w-10 h-10 object-contain flex-shrink-0"
                        />
                      </Link>
                      <div className="h-px bg-gray-100 mx-2" />
                    </>
                  ) : null}

                  {/* Guests: find trips */}
                  {!isOwner ? (
                    <Link
                      href="/bookings"
                      onClick={() => setDesktopMenuOpen(false)}
                      className={menuPlainClass}
                    >
                      Find bookings
                    </Link>
                  ) : null}

                  {/* Owner: property + personal (plain rows; calendar opens full bookings page) */}
                  {isOwner ? (
                    <>
                      <div className="px-4 pb-1 pt-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Your property
                        </p>
                      </div>
                      <Link
                        href="/manage/calendar"
                        onClick={() => setDesktopMenuOpen(false)}
                        className={menuPlainClass}
                      >
                        Calendar &amp; availability
                      </Link>
                      <Link
                        href={OWNER_INQUIRIES_HREF}
                        onClick={() => setDesktopMenuOpen(false)}
                        aria-label={
                          (ownerPendingCount ?? 0) > 0
                            ? `Inquiries, ${ownerPendingCount} pending`
                            : 'Inquiries'
                        }
                        className={menuPlainBetweenClass}
                      >
                        <span>Inquiries</span>
                        {(ownerPendingCount ?? 0) > 0 ? (
                          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-normal tabular-nums text-red-800">
                            {ownerPendingCount! > 99 ? '99+' : ownerPendingCount}
                          </span>
                        ) : null}
                      </Link>
                      <Link
                        href="/manage/promotions"
                        onClick={() => setDesktopMenuOpen(false)}
                        className={menuPlainClass}
                      >
                        Promotions
                      </Link>

                      <div className="px-4 pb-1 pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Personal</p>
                      </div>
                      <Link href="/saved" onClick={() => setDesktopMenuOpen(false)} className={menuPlainClass}>
                        My favorites
                      </Link>
                    </>
                  ) : (
                    <Link href="/saved" onClick={() => setDesktopMenuOpen(false)} className={menuPlainClass}>
                      Saved gyms
                    </Link>
                  )}

                  {/* Customer service, then Help Centre */}
                  <Link href="/contact" onClick={() => setDesktopMenuOpen(false)} className={menuPlainClass}>
                    Customer service
                  </Link>
                  <Link href="/faq" onClick={() => setDesktopMenuOpen(false)} className={menuPlainClass}>
                    Help Centre
                  </Link>

                  {/* Admin links when applicable */}
                  {user && profile?.role === 'admin' && (
                    <>
                      <div className="h-px bg-gray-100 mx-2" />
                      <Link href="/admin" onClick={() => setDesktopMenuOpen(false)} className={menuPlainClass}>
                        Admin Dashboard
                      </Link>
                    </>
                  )}

                  <div className="h-px bg-gray-100 mx-2" />

                  {/* Sign in / Sign up OR Sign out */}
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleSignOut()
                        setDesktopMenuOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      Sign out
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      onClick={() => setDesktopMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-normal text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Log in or sign up
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation — same stacking guard as desktop */}
          <div className="flex md:hidden items-center gap-1 relative z-[100]">
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
              className="p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors touch-manipulation"
              onClick={() => setMobileMenuOpen((v) => !v)}
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

                  {/* Partner CTA: list gym (guests / owners in onboarding) or owner dashboard */}
                  <div className="pt-2">
                    {isOwner && !ownerOnboardingNavLock ? (
                      <Link
                        href="/manage"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#003580]/10">
                            <LayoutDashboard className="h-7 w-7 text-[#003580]" strokeWidth={1.75} aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[15px] font-semibold text-gray-900">Dashboard</div>
                            <div className="mt-1 text-[13px] leading-snug text-gray-500">
                              Manage your gym, bookings, and settings.
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : isOwnerPending ? (
                      <Link
                        href={ownerOnboarding.nextStepHref}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                      >
                        <div>
                          <div className="text-[15px] font-semibold text-gray-900">Finish your listing</div>
                          <div className="mt-1 text-[13px] leading-snug text-gray-500">
                            Complete a few short steps to start accepting bookings.
                          </div>
                        </div>
                        <img
                          src="/ChatGPT Image Mar 18, 2026 at 05_02_15 PM.png"
                          alt=""
                          aria-hidden
                          className="h-14 w-14 flex-shrink-0 object-contain"
                        />
                      </Link>
                    ) : (
                      <Link
                        href="/owners"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                      >
                        <div>
                          <div className="text-[15px] font-semibold text-gray-900">List your gym</div>
                          <div className="mt-1 text-[13px] leading-snug text-gray-500">
                            Start earning by listing your combat sports gym.
                          </div>
                        </div>
                        <img
                          src="/ChatGPT Image Mar 18, 2026 at 05_02_15 PM.png"
                          alt=""
                          aria-hidden
                          className="h-14 w-14 flex-shrink-0 object-contain"
                        />
                      </Link>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-200 my-2" />

                  {/* Guests (signed in): quick links — hidden when signed out (Booking-style; lookup lives under Help). */}
                  {!isOwner && user ? (
                    <div className="space-y-0 pt-2">
                      <Link
                        href="/bookings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        Find bookings
                      </Link>
                      <Link
                        href="/saved"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        Saved gyms
                      </Link>
                    </div>
                  ) : null}

                  {!isOwner && user ? <div className="h-px bg-gray-200 my-2" /> : null}

                  {/* Owner: same plain rows as desktop (calendar → full bookings page) */}
                  {isOwner ? (
                    <div className="space-y-0 pt-2">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 px-0">
                        Your property
                      </div>
                      <Link
                        href="/manage/calendar"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        Calendar &amp; availability
                      </Link>
                      <Link
                        href={OWNER_INQUIRIES_HREF}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label={
                          (ownerPendingCount ?? 0) > 0
                            ? `Inquiries, ${ownerPendingCount} pending`
                            : 'Inquiries'
                        }
                        className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        <span>Inquiries</span>
                        {(ownerPendingCount ?? 0) > 0 ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-normal tabular-nums text-red-800">
                            {ownerPendingCount! > 99 ? '99+' : ownerPendingCount}
                          </span>
                        ) : null}
                      </Link>
                      <Link
                        href="/manage/promotions"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        Promotions
                      </Link>

                      <div className="pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Personal</div>
                      <Link
                        href="/saved"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        My favorites
                      </Link>
                    </div>
                  ) : null}

                  {isOwner ? <div className="h-px bg-gray-200 my-2" /> : null}

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
                        <div className="text-sm text-gray-900">About CombatStay.com</div>
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

                  {/* Help — Customer service first, then Help Centre (plain rows) */}
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-0">
                      Help
                    </div>
                    <Link
                      href="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      Customer service
                    </Link>
                    <Link
                      href="/faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      Help Centre
                    </Link>
                    {!user ? (
                      <>
                        <Link
                          href="/bookings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                        >
                          Find your booking
                        </Link>
                        <Link
                          href="/saved"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full py-3 text-left text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                        >
                          Saved gyms
                        </Link>
                      </>
                    ) : null}
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

                        {/* Signed-in guests: find/saved above; signed-out: same links under Help */}

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
