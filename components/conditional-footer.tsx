'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/footer'

/** Omits the global footer on hub dashboards so they aren’t followed by site chrome. */
export function ConditionalFooter() {
  const pathname = usePathname() ?? ''
  if (
    pathname === '/manage' ||
    pathname.startsWith('/manage/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/auth')
  ) {
    return null
  }

  const isSavedRoute = pathname === '/saved' || pathname.startsWith('/saved/')

  return (
    <div className={isSavedRoute ? 'hidden md:block' : undefined}>
      <Footer />
    </div>
  )
}
