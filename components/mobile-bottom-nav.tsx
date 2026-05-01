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
    lastScrollYRef.current = window.scrollY
  }, [pathname])

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
      className={`md:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-[#ebebeb] bg-white px-6 pt-2 pb-3 supports-[padding:max(0px)]:pb-[max(0.7rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-200 ease-out ${
        hidden
          ? 'pointer-events-none translate-y-[calc(100%+env(safe-area-inset-bottom)+24px)] border-transparent bg-transparent opacity-0'
          : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="mx-auto flex max-w-[22rem] items-center justify-center gap-4">
        {items.map((item) => {
          const Icon = item.icon
          const activeClass = item.active ? 'font-medium text-[#003580]' : 'font-normal text-gray-500'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-20 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-center text-[11px] leading-tight transition-colors active:bg-blue-50 ${activeClass}`}
            >
              <Icon className="h-6 w-6" strokeWidth={item.active ? 2.1 : 1.75} aria-hidden />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
