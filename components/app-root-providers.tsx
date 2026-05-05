'use client'

import type { ReactNode } from 'react'
import { CurrencyProvider } from '@/lib/contexts/currency-context'
import { AuthProvider } from '@/lib/hooks/use-auth'

export function AppRootProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </AuthProvider>
  )
}
