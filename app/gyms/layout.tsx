import type { ReactNode } from 'react'
import { ScrollToTopOnRoute } from '@/components/scroll-to-top-on-mount'

export default function GymsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollToTopOnRoute />
      {children}
    </>
  )
}
