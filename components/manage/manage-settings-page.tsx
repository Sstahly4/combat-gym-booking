'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import { SettingsToastProvider, useSettingsToast } from '@/components/manage/settings-toast'
import { SettingsPersonalSection } from '@/components/manage/settings-personal-section'
import { SettingsSecuritySection } from '@/components/manage/settings-security-section'
import { SettingsCommunicationsSection } from '@/components/manage/settings-communications-section'
import { SettingsFacilitySection } from '@/components/manage/settings-facility-section'
import { SettingsPayoutsSection } from '@/components/manage/settings-payouts-section'
import { Select } from '@/components/ui/select'
import { User, Shield, Bell, Building2, Wallet } from 'lucide-react'

export type ManageSettingsTab = 'personal' | 'security' | 'communications' | 'facility' | 'payouts'

/** Back-compat with older routes that still import `ManageSettingsFocus`. */
export type ManageSettingsFocus = ManageSettingsTab | null

type TabDefinition = {
  id: ManageSettingsTab
  label: string
  description: string
  Icon: typeof User
}

const TABS: TabDefinition[] = [
  {
    id: 'personal',
    label: 'Personal details',
    description: 'Name, phone and language.',
    Icon: User,
  },
  {
    id: 'security',
    label: 'Security & login',
    description: 'Password, 2FA and sessions.',
    Icon: Shield,
  },
  {
    id: 'communications',
    label: 'Communications',
    description: 'Email and SMS preferences.',
    Icon: Bell,
  },
  {
    id: 'facility',
    label: 'Gym / camp management',
    description: 'Facility profile and team access.',
    Icon: Building2,
  },
  {
    id: 'payouts',
    label: 'Payouts',
    description: 'How you get paid and transfer status per gym.',
    Icon: Wallet,
  },
]

const TAB_IDS = new Set<ManageSettingsTab>(TABS.map((t) => t.id))

function isTab(value: string | null | undefined): value is ManageSettingsTab {
  return !!value && TAB_IDS.has(value as ManageSettingsTab)
}

function SettingsTabContent({ tab }: { tab: ManageSettingsTab }) {
  switch (tab) {
    case 'personal':
      return <SettingsPersonalSection />
    case 'security':
      return <SettingsSecuritySection />
    case 'communications':
      return <SettingsCommunicationsSection />
    case 'facility':
      return <SettingsFacilitySection />
    case 'payouts':
      return <SettingsPayoutsSection />
  }
}

function ManageSettingsInner({ focusSection = null }: { focusSection?: ManageSettingsFocus }) {
  const router = useRouter()
  const pathname = usePathname() ?? '/manage/settings'
  const searchParams = useSearchParams()
  const { confirmDiscardIfDirty } = useSettingsToast()

  const initialTab: ManageSettingsTab = isTab(searchParams?.get('tab'))
    ? (searchParams!.get('tab') as ManageSettingsTab)
    : isTab(focusSection ?? null)
    ? (focusSection as ManageSettingsTab)
    : 'personal'

  const [activeTab, setActiveTab] = useState<ManageSettingsTab>(initialTab)

  useEffect(() => {
    const paramTab = searchParams?.get('tab')
    if (isTab(paramTab) && paramTab !== activeTab) {
      setActiveTab(paramTab)
    }
  }, [searchParams, activeTab])

  const syncUrl = useCallback(
    (tab: ManageSettingsTab) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      params.set('tab', tab)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const requestTab = useCallback(
    (next: ManageSettingsTab) => {
      if (next === activeTab) return
      if (!confirmDiscardIfDirty(activeTab)) return
      setActiveTab(next)
      syncUrl(next)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [activeTab, confirmDiscardIfDirty, syncUrl]
  )

  const activeDef = useMemo(() => TABS.find((t) => t.id === activeTab) ?? TABS[0], [activeTab])

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <ManageBreadcrumbs
          items={[
            { label: 'Dashboard', href: '/manage' },
            { label: 'Settings' },
          ]}
        />
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Manage your account, security, and the facilities you operate. Changes save per section.
        </p>

        <div className="mt-6 sm:hidden">
          <label htmlFor="settings-mobile-tab" className="sr-only">
            Choose a settings section
          </label>
          <Select
            id="settings-mobile-tab"
            value={activeTab}
            onChange={(event) => requestTab(event.target.value as ManageSettingsTab)}
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-6 grid gap-6 sm:mt-8 md:grid-cols-[240px,1fr] md:gap-8">
          <aside className="hidden md:block">
            <nav aria-label="Settings sections" className="sticky top-20">
              <ul className="flex flex-col gap-1">
                {TABS.map((tab) => {
                  const isActive = tab.id === activeTab
                  const Icon = tab.Icon
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        onClick={() => requestTab(tab.id)}
                        className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                          isActive
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                            : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                            isActive ? 'text-[#003580]' : 'text-gray-500 group-hover:text-gray-700'
                          }`}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-tight">{tab.label}</span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">{tab.description}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>

          <main className="min-w-0">
            <div className="mb-4 hidden items-center gap-2 md:flex">
              <activeDef.Icon className="h-5 w-5 text-[#003580]" strokeWidth={1.75} aria-hidden />
              <h2 className="text-lg font-semibold text-gray-900">{activeDef.label}</h2>
            </div>
            <div id={`settings-tab-${activeTab}`} className="space-y-6">
              <SettingsTabContent tab={activeTab} />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export function ManageSettingsPage({ focusSection = null }: { focusSection?: ManageSettingsFocus }) {
  return (
    <SettingsToastProvider>
      <ManageSettingsInner focusSection={focusSection} />
    </SettingsToastProvider>
  )
}
