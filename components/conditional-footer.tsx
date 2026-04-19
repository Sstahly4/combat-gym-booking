'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/footer'

/** Omits the global footer on owner dashboard routes so the manage area isn’t followed by site chrome. */
export function ConditionalFooter() {
  const pathname = usePathname() ?? ''
  if (pathname === '/manage' || pathname.startsWith('/manage/')) {
    return null
  }
  return <Footer />
}
