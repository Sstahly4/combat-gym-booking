'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useSettingsToast } from '@/components/manage/settings-toast'
import { settingsCardClass } from '@/components/manage/settings-shared'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { Users, ExternalLink } from 'lucide-react'

type Facility = {
  id: string
  name: string
  timezone: string
  public_contact_phone: string
  city: string
  country: string
}

const EMPTY_FACILITY: Facility = {
  id: '',
  name: '',
  timezone: '',
  public_contact_phone: '',
  city: '',
  country: '',
}

const POPULAR_TIMEZONES: { value: string; label: string }[] = [
  { value: '', label: 'Detect from device' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT · UTC+7)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
  { value: 'Asia/Manila', label: 'Asia/Manila (UTC+8)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10/11)' },
  { value: 'Australia/Brisbane', label: 'Australia/Brisbane (UTC+10)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (UTC+12/13)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0/1)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (UTC+1/2)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (UTC+1/2)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (UTC-8/7)' },
  { value: 'America/New_York', label: 'America/New York (UTC-5/4)' },
  { value: 'America/Sao_Paulo', label: 'America/São Paulo (UTC-3)' },
  { value: 'UTC', label: 'UTC' },
]

function facilityEqual(a: Facility, b: Facility) {
  return (
    a.name === b.name &&
    a.timezone === b.timezone &&
    a.public_contact_phone === b.public_contact_phone
  )
}

export function SettingsFacilitySection() {
  const { showToast, setDirty } = useSettingsToast()
  const { gyms, activeGymId, setActiveGymId, loading: gymsLoading, refreshGyms } = useActiveGym()
  const [facility, setFacility] = useState<Facility>(EMPTY_FACILITY)
  const [initial, setInitial] = useState<Facility>(EMPTY_FACILITY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (gymId: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/manage/settings/facility?gym_id=${encodeURIComponent(gymId)}`, {
          cache: 'no-store',
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Could not load facility details')
          return
        }
        const next: Facility = {
          id: data.facility.id,
          name: data.facility.name ?? '',
          timezone: data.facility.timezone ?? '',
          public_contact_phone: data.facility.public_contact_phone ?? '',
          city: data.facility.city ?? '',
          country: data.facility.country ?? '',
        }
        setFacility(next)
        setInitial(next)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not load facility details')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!activeGymId) {
      setLoading(false)
      setFacility(EMPTY_FACILITY)
      setInitial(EMPTY_FACILITY)
      return
    }
    void load(activeGymId)
  }, [activeGymId, load])

  const dirty = useMemo(() => !facilityEqual(facility, initial), [facility, initial])

  useEffect(() => {
    setDirty('facility', dirty)
    return () => setDirty('facility', false)
  }, [dirty, setDirty])

  const onChange = <K extends keyof Facility>(key: K, value: Facility[K]) => {
    setFacility((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    if (!activeGymId) return
    setSaving(true)
    try {
      const res = await fetch('/api/manage/settings/facility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: activeGymId,
          name: facility.name.trim(),
          timezone: facility.timezone.trim() || null,
          public_contact_phone: facility.public_contact_phone.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const detailMsg =
          data?.details?.fieldErrors
            ? Object.values(data.details.fieldErrors).flat().join('. ')
            : ''
        showToast(detailMsg || data.error || 'Could not save facility details', 'error')
        return
      }
      setInitial({ ...facility })
      await refreshGyms()
      showToast('Facility profile saved.')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Could not save facility details', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (gymsLoading) {
    return <p className="text-sm text-gray-500">Loading your gyms…</p>
  }

  if (gyms.length === 0) {
    return (
      <Card className={settingsCardClass}>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            You don&apos;t have any listings yet.{' '}
            <Link href="/manage/list-your-gym" className="font-medium text-[#003580] underline underline-offset-2">
              List your first gym
            </Link>{' '}
            to unlock facility settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {gyms.length > 1 ? (
        <Card className={settingsCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Choose a facility</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              You manage multiple listings. Settings below apply to the facility selected here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={activeGymId ?? ''}
              onChange={(event) => setActiveGymId(event.target.value)}
              className="sm:max-w-md"
            >
              {gyms.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      ) : null}

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Facility profile</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Operational details for this gym or camp. These appear on your public listing and receipts and are kept
            separate from your personal account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="facility-name">Display name</Label>
                <Input
                  id="facility-name"
                  placeholder="e.g. Tiger Muay Thai, Phuket"
                  value={facility.name}
                  onChange={(event) => onChange('name', event.target.value)}
                />
                <p className="text-xs text-gray-500">
                  This is the primary name travellers see. Location: {facility.city || '—'}
                  {facility.country ? `, ${facility.country}` : ''}. Change city/country in{' '}
                  <Link href="/manage/gym/edit" className="text-[#003580] underline underline-offset-2">
                    Edit gym
                  </Link>
                  .
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facility-phone">Reception phone</Label>
                  <Input
                    id="facility-phone"
                    type="tel"
                    placeholder="+66 76 000 000"
                    value={facility.public_contact_phone}
                    onChange={(event) => onChange('public_contact_phone', event.target.value)}
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500">
                    Public number for arrivals and guest questions. Not used for account recovery.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facility-timezone">Timezone</Label>
                  <Select
                    id="facility-timezone"
                    value={facility.timezone}
                    onChange={(event) => onChange('timezone', event.target.value)}
                  >
                    {POPULAR_TIMEZONES.map((tz) => (
                      <option key={tz.value || 'auto'} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                    {facility.timezone &&
                    !POPULAR_TIMEZONES.some((t) => t.value === facility.timezone) ? (
                      <option value={facility.timezone}>{facility.timezone} (current)</option>
                    ) : null}
                  </Select>
                  <p className="text-xs text-gray-500">
                    Used for session schedules and report windows. Travellers still see arrivals in their own timezone.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Users className="h-5 w-5 text-[#003580]" strokeWidth={1.75} aria-hidden />
            Team access
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
              Coming soon
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Invite a front-desk manager or gym coordinator to view bookings without giving access to payouts or
            security settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 rounded-lg border border-dashed border-gray-200 bg-slate-50/70 p-4 text-sm text-gray-600">
            <p>
              We&apos;re adding role-based team access. Planned roles: <strong>Owner</strong>,{' '}
              <strong>Manager</strong> (bookings + listing), <strong>Front-desk</strong> (bookings view only).
            </p>
            <p className="text-xs text-gray-500">
              Need early access for a multi-camp operation?{' '}
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 font-medium text-[#003580] underline underline-offset-2"
              >
                Contact us
                <ExternalLink className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              </Link>
              .
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
          onClick={() => setFacility(initial)}
          disabled={!dirty || saving}
          className="border-gray-300"
        >
          Discard
        </Button>
        <Button onClick={() => void submit()} disabled={!dirty || saving || !activeGymId || !facility.name.trim()}>
          {saving ? 'Saving…' : 'Save facility'}
        </Button>
      </div>
    </div>
  )
}
