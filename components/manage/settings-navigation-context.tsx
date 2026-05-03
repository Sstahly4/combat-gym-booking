'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type SettingsNavTab = 'personal' | 'security' | 'communications' | 'facility' | 'payouts'

type Value = {
  /** Switch settings tab with the same discard guard as the sidebar. */
  navigateToTab: (tab: SettingsNavTab) => void
}

const SettingsNavigationContext = createContext<Value | null>(null)

export function SettingsNavigationProvider({
  children,
  navigateToTab,
}: {
  children: ReactNode
  navigateToTab: (tab: SettingsNavTab) => void
}) {
  return <SettingsNavigationContext.Provider value={{ navigateToTab }}>{children}</SettingsNavigationContext.Provider>
}

export function useSettingsNavigation(): Value | null {
  return useContext(SettingsNavigationContext)
}
