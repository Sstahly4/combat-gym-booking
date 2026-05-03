'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useSettingsNavigation } from '@/components/manage/settings-navigation-context'
import { useSettingsToast } from '@/components/manage/settings-toast'
import { settingsCardClass } from '@/components/manage/settings-shared'
import { useCurrency, CURRENCIES } from '@/lib/contexts/currency-context'

type PersonalProfile = {
  full_name: string
  preferred_language: string
  backup_email: string
  account_holder_phone: string
}

const EMPTY_PROFILE: PersonalProfile = {
  full_name: '',
  preferred_language: '',
  backup_email: '',
  account_holder_phone: '',
}

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Use my browser language' },
  { value: 'en', label: 'English' },
  { value: 'en-AU', label: 'English (Australia)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'th', label: 'Thai (ภาษาไทย)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese (日本語)' },
]

function equalProfiles(a: PersonalProfile, b: PersonalProfile) {
  return (
    a.full_name === b.full_name &&
    a.preferred_language === b.preferred_language &&
    a.backup_email === b.backup_email &&
    a.account_holder_phone === b.account_holder_phone
  )
}

export function SettingsPersonalSection() {
  const { showToast, setDirty } = useSettingsToast()
  const settingsNav = useSettingsNavigation()
  const { selectedCurrency, setSelectedCurrency } = useCurrency()
  const [profile, setProfile] = useState<PersonalProfile>(EMPTY_PROFILE)
  const [initial, setInitial] = useState<PersonalProfile>(EMPTY_PROFILE)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/manage/settings/profile', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not load profile')
        return
      }
      const next: PersonalProfile = {
        full_name: data.profile?.full_name ?? '',
        preferred_language: data.profile?.preferred_language ?? '',
        backup_email: data.profile?.backup_email ?? '',
        account_holder_phone: data.profile?.account_holder_phone ?? '',
      }
      setProfile(next)
      setInitial(next)
      setAuthEmail(data.email ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => !equalProfiles(profile, initial), [profile, initial])

  useEffect(() => {
    setDirty('personal', dirty)
    return () => setDirty('personal', false)
  }, [dirty, setDirty])

  const onChange = <K extends keyof PersonalProfile>(key: K, value: PersonalProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/manage/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profile.full_name.trim() || null,
          preferred_language: profile.preferred_language.trim() || null,
          backup_email: profile.backup_email.trim() || null,
          account_holder_phone: profile.account_holder_phone.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const detailMsg =
          data?.details?.fieldErrors
            ? Object.values(data.details.fieldErrors).flat().join('. ')
            : ''
        showToast(detailMsg || data.error || 'Could not save profile', 'error')
        return
      }
      setInitial({ ...profile })
      showToast('Personal details saved.')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Could not save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Account owner</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            This is <span className="font-medium text-gray-700">your personal account</span>, separate from the gym
            reception details. Use your real name so our support team can verify you quickly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="personal-name">Full name</Label>
                  <Input
                    id="personal-name"
                    placeholder="e.g. Alex Rodriguez"
                    value={profile.full_name}
                    onChange={(event) => onChange('full_name', event.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal-phone">Account holder phone</Label>
                  <Input
                    id="personal-phone"
                    type="tel"
                    placeholder="+61 400 000 000"
                    value={profile.account_holder_phone}
                    onChange={(event) => onChange('account_holder_phone', event.target.value)}
                    autoComplete="tel"
                  />
                  <p className="text-xs text-gray-500">
                    Used for urgent account calls only. Public gym phone lives under Facility.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personal-email">Sign-in email</Label>
                <Input id="personal-email" value={authEmail ?? ''} disabled className="bg-slate-50" />
                <p className="text-xs text-gray-500">
                  To change your login email, go to{' '}
                  <Link
                    href="/manage/settings?tab=security"
                    className="text-[#003580] underline underline-offset-2 hover:text-[#002a5c]"
                    onClick={(e) => {
                      if (settingsNav) {
                        e.preventDefault()
                        settingsNav.navigateToTab('security')
                      }
                    }}
                  >
                    Security &amp; login
                  </Link>
                  .
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Language &amp; localization</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Choose the language we use for emails, receipts, and the dashboard, and how prices are shown. Gym schedules
            still follow each facility&apos;s local time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 sm:max-w-sm">
            <Label htmlFor="personal-language">Preferred language</Label>
            <Select
              id="personal-language"
              value={profile.preferred_language}
              onChange={(event) => onChange('preferred_language', event.target.value)}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value || 'auto'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:max-w-sm">
            <Label htmlFor="personal-currency">Preferred currency</Label>
            <Select
              id="personal-currency"
              value={selectedCurrency}
              onChange={(event) => setSelectedCurrency(event.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-gray-500">
              Used for prices on the public site and in your dashboard (same as the globe menu in the header). Saved on
              this device; change anytime.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {dirty ? (
          <span className="text-xs text-amber-700">You have unsaved changes.</span>
        ) : null}
        <Button
          variant="outline"
          onClick={() => setProfile(initial)}
          disabled={!dirty || saving}
          className="border-gray-300"
        >
          Discard
        </Button>
        <Button onClick={() => void submit()} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
