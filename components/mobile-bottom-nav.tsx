'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Heart, LayoutDashboard, Search, Shield, UserCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'

type BottomNavItem = {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
}

function isHiddenRoute(pathname: string) {
  return (
    pathname.startsWith('/manage') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/bookings/summary') ||
    pathname.startsWith('/bookings/request-access') ||
    /^\/bookings\/[^/]+/.test(pathname)
  )
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? ''
  const { user, profile, loading } = useAuth()
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)
  const [hidden, setHidden] = useState(false)
  /**
   * After the slide-out transition finishes, fully detach the bar from layout.
   * iOS Safari only collapses its bottom URL toolbar when nothing is `position: fixed`
   * at the bottom of the page — a translated-but-still-fixed bar keeps Safari's
   * chrome expanded. Setting `display: none` after the transition lets Safari hide
   * its URL pill the same way it does on Airbnb.
   */
  const [removedFromLayout, setRemovedFromLayout] = useState(false)
  /** Brief centered cluster on route entry, then widen to full spread (Airbnb-style). */
  const [useWideTabLayout, setUseWideTabLayout] = useState(false)

  useEffect(() => {
    lastScrollYRef.current = window.scrollY

    const handleScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const previousY = lastScrollYRef.current
        const delta = currentY - previousY

        if (currentY < 32) {
          setHidden(false)
        } else if (delta > 8 && currentY > 96) {
          setHidden(true)
        } else if (delta < -8) {
          setHidden(false)
        }

        lastScrollYRef.current = currentY
        tickingRef.current = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setHidden(false)
    setRemovedFromLayout(false)
    lastScrollYRef.current = window.scrollY
    setUseWideTabLayout(false)
    const id = window.setTimeout(() => setUseWideTabLayout(true), 240)
    return () => window.clearTimeout(id)
  }, [pathname])

  // Whenever the bar becomes visible again, immediately ensure it's in layout.
  useEffect(() => {
    if (!hidden) setRemovedFromLayout(false)
  }, [hidden])

  const accountItem = useMemo<BottomNavItem>(() => {
    if (loading) {
      return {
        href: '/auth/signin',
        label: 'Account',
        icon: UserCircle,
        active: false,
      }
    }

    if (!user) {
      return {
        href: '/auth/signin',
        label: 'Log in',
        icon: UserCircle,
        active: pathname.startsWith('/auth'),
      }
    }

    if (profile?.role === 'admin') {
      return {
        href: '/admin',
        label: 'Admin',
        icon: Shield,
        active: pathname.startsWith('/admin'),
      }
    }

    if (profile?.role === 'owner') {
      return {
        href: '/manage',
        label: 'Dashboard',
        icon: LayoutDashboard,
        active: pathname.startsWith('/manage'),
      }
    }

    return {
      href: '/bookings',
      label: 'Bookings',
      icon: CalendarDays,
      active: pathname === '/bookings',
    }
  }, [loading, pathname, profile?.role, user])

  if (isHiddenRoute(pathname)) return null

  const items: BottomNavItem[] = [
    {
      href: '/',
      label: 'Explore',
      icon: Search,
      active: pathname === '/',
    },
    {
      href: '/saved',
      label: 'Saved',
      icon: Heart,
      active: pathname.startsWith('/saved'),
    },
    accountItem,
  ]

  return (
    <nav
      aria-label="Primary mobile navigation"
      aria-hidden={hidden}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[60] md:hidden ${
        removedFromLayout ? 'invisible' : ''
      }`}
    >
      {/*
        Outer shell stays transparent so iOS Safari does not paint a second white band
        above the browser chrome when the bar is dismissed. Only the inner panel is white.
        After the slide-out finishes we toggle `removedFromLayout` so Safari can collapse
        its own bottom URL toolbar (it stays expanded while any fixed bottom element exists).
      */}
      <div
        onTransitionEnd={(e) => {
          if (e.propertyName !== 'transform') return
          if (hidden) setRemovedFromLayout(true)
        }}
        className={`pointer-events-auto transform-gpu bg-white px-6 pt-2 transition-transform duration-200 ease-out will-change-transform backface-hidden supports-[padding:max(0px)]:pb-[max(0.7rem,env(safe-area-inset-bottom))] pb-3 ${
          hidden
            ? 'pointer-events-none translate-y-[calc(100%+3px)] border-transparent'
            : 'translate-y-0 border-t border-[#ebebeb]'
        }`}
      >
        <div
          className={`mx-auto flex items-center transition-[max-width,gap] duration-300 ease-out ${
            useWideTabLayout
              ? 'w-full max-w-none justify-around gap-2'
              : 'max-w-[22rem] justify-center gap-5'
          }`}
        >
          {items.map((item) => {
            const Icon = item.icon
            const activeClass = item.active ? 'font-medium text-[#003580]' : 'font-normal text-gray-500'

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-center text-[11px] leading-tight transition-colors active:bg-blue-50 ${
                  useWideTabLayout ? 'flex-1' : 'w-20'
                } ${activeClass}`}
              >
                <Icon className="h-6 w-6" strokeWidth={item.active ? 2.1 : 1.75} aria-hidden />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
