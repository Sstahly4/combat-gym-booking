'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MfaTotpInlineSection } from '@/components/manage/mfa-totp-inline-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSettingsToast } from '@/components/manage/settings-toast'
import { settingsCardClass } from '@/components/manage/settings-shared'
import { Laptop, Smartphone, Globe, ShieldAlert, KeyRound, LogOut, Mail, MonitorSmartphone } from 'lucide-react'

type SecurityEventRow = {
  id: string
  event_type: string
  metadata: Record<string, unknown> | null
  created_at: string
}

function formatEventLabel(type: string): string {
  switch (type) {
    case 'sign_in':
      return 'Sign-in'
    case 'oauth_sign_in':
      return 'OAuth sign-in'
    case 'password_changed':
      return 'Password changed'
    case 'email_changed':
      return 'Email changed'
    case 'security_onboarding_completed':
      return 'Security onboarding completed'
    case 'new_device_sign_in':
      return 'New device sign-in'
    case 'mfa_recovery_codes_generated':
      return 'Recovery codes generated'
    case 'mfa_recovery_code_consumed':
      return 'Recovery code used'
    default:
      return type.replace(/_/g, ' ')
  }
}

function describeUserAgent(ua: string | null | undefined): {
  device: string
  browser: string
  Icon: typeof Laptop
} {
  const agent = (ua || '').toLowerCase()
  let Icon: typeof Laptop = Laptop
  let device = 'Unknown device'
  let browser = 'Browser'

  if (/iphone|ipad|ipod/.test(agent)) {
    device = 'iOS device'
    Icon = Smartphone
  } else if (/android/.test(agent)) {
    device = 'Android device'
    Icon = Smartphone
  } else if (/mac os x|macintosh/.test(agent)) {
    device = 'macOS'
    Icon = Laptop
  } else if (/windows/.test(agent)) {
    device = 'Windows'
    Icon = Laptop
  } else if (/linux/.test(agent)) {
    device = 'Linux'
    Icon = Laptop
  } else if (agent) {
    Icon = Globe
  }

  if (/edg\//.test(agent)) browser = 'Microsoft Edge'
  else if (/chrome\//.test(agent) && !/edg\//.test(agent)) browser = 'Chrome'
  else if (/firefox\//.test(agent)) browser = 'Firefox'
  else if (/safari\//.test(agent) && !/chrome\//.test(agent)) browser = 'Safari'

  return { device, browser, Icon }
}

function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime()
  if (delta < 60_000) return 'Just now'
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString()
}

export function SettingsSecuritySection() {
  const router = useRouter()
  const { showToast, setDirty } = useSettingsToast()

  const [emailPassword, setEmailPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [backupEmail, setBackupEmail] = useState('')
  const [initialBackupEmail, setInitialBackupEmail] = useState('')
  const [backupLoading, setBackupLoading] = useState(true)
  const [backupSaving, setBackupSaving] = useState(false)

  const [events, setEvents] = useState<SecurityEventRow[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [signOutAllBusy, setSignOutAllBusy] = useState(false)

  const [currentUa, setCurrentUa] = useState<string | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setCurrentUa(navigator.userAgent || null)
    }
  }, [])

  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    setEventsError(null)
    try {
      const res = await fetch('/api/auth/security/events?limit=25', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        setEventsError(data.error || 'Could not load activity')
        return
      }
      setEvents(data.events || [])
    } catch (e: unknown) {
      setEventsError(e instanceof Error ? e.message : 'Could not load activity')
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const loadBackupEmail = useCallback(async () => {
    setBackupLoading(true)
    try {
      const res = await fetch('/api/manage/settings/profile', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        const current = data.profile?.backup_email ?? ''
        setBackupEmail(current)
        setInitialBackupEmail(current)
      }
    } catch {
      // non-fatal
    } finally {
      setBackupLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEvents()
    void loadBackupEmail()
  }, [loadEvents, loadBackupEmail])

  const backupDirty = useMemo(
    () => backupEmail.trim() !== initialBackupEmail.trim(),
    [backupEmail, initialBackupEmail]
  )

  useEffect(() => {
    setDirty('security-backup', backupDirty)
    return () => setDirty('security-backup', false)
  }, [backupDirty, setDirty])

  const saveBackupEmail = async () => {
    setBackupSaving(true)
    try {
      const res = await fetch('/api/manage/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_email: backupEmail.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        const detailMsg = data?.details?.fieldErrors?.backup_email
          ? data.details.fieldErrors.backup_email.join('. ')
          : ''
        showToast(detailMsg || data.error || 'Could not save backup email', 'error')
        return
      }
      setInitialBackupEmail(backupEmail.trim())
      showToast('Backup email saved.')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Could not save backup email', 'error')
    } finally {
      setBackupSaving(false)
    }
  }

  const signOutEverywhere = async () => {
    if (!window.confirm('Sign out on all devices? You will need to sign in again everywhere.')) return
    setSignOutAllBusy(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) {
        showToast(error.message, 'error')
        setSignOutAllBusy(false)
        return
      }
      router.replace('/auth/signin?redirect=/manage')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Sign out failed', 'error')
      setSignOutAllBusy(false)
    }
  }

  const submitEmailUpdate = async () => {
    setEmailLoading(true)
    try {
      const response = await fetch('/api/auth/email/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: emailPassword, new_email: newEmail }),
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data.error || 'Failed to update email', 'error')
        return
      }
      showToast(data.message || 'Check your inbox to confirm the new email.')
      setEmailPassword('')
      setNewEmail('')
      void loadEvents()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update email', 'error')
    } finally {
      setEmailLoading(false)
    }
  }

  const submitPasswordUpdate = async () => {
    setPasswordLoading(true)
    try {
      if (newPassword !== confirmPassword) {
        showToast('New password and confirmation do not match.', 'error')
        setPasswordLoading(false)
        return
      }

      const response = await fetch('/api/auth/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        const msg = Array.isArray(data.details) && data.details.length > 0
          ? data.details.join('. ')
          : data.error || 'Failed to update password'
        showToast(msg, 'error')
        return
      }
      showToast(
        data.signed_out_others
          ? 'Password updated. Other signed-in sessions were signed out.'
          : 'Password updated successfully.'
      )
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      void loadEvents()
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update password', 'error')
    } finally {
      setPasswordLoading(false)
    }
  }

  const currentDevice = describeUserAgent(currentUa)
  const recentSignIns = useMemo(
    () => events.filter((e) => e.event_type === 'sign_in' || e.event_type === 'oauth_sign_in').slice(0, 5),
    [events]
  )
  const otherEvents = useMemo(
    () => events.filter((e) => e.event_type !== 'sign_in' && e.event_type !== 'oauth_sign_in').slice(0, 5),
    [events]
  )

  return (
    <div className="space-y-6">
      <Card id="settings-password" className={`${settingsCardClass} scroll-mt-24`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <KeyRound className="h-5 w-5 text-[#003580]" strokeWidth={1.75} aria-hidden />
            Password
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Pick a strong password you don&apos;t use anywhere else. Saving a new password signs out{' '}
            <strong className="font-medium text-gray-700">everywhere except this browser</strong> (other sessions are
            invalidated).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="current-password">Current password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-[#003580] hover:underline"
                >
                  Forgot it?
                </Link>
              </div>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <Button
              onClick={() => void submitPasswordUpdate()}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {passwordLoading ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Mail className="h-5 w-5 text-[#003580]" strokeWidth={1.75} aria-hidden />
            Sign-in email
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Changing your login email requires your current password and a confirmation click in the new inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-email">New email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="new-email@example.com"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-password">Current password</Label>
              <PasswordInput
                id="email-password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <Button onClick={() => void submitEmailUpdate()} disabled={emailLoading || !newEmail || !emailPassword}>
              {emailLoading ? 'Updating…' : 'Confirm and update email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Backup email</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            A secondary address we can use to help you recover your account if you lose access to your login email.
            This is not a sign-in alternative.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 sm:max-w-md">
            <Label htmlFor="backup-email">Backup email</Label>
            <Input
              id="backup-email"
              type="email"
              placeholder="recovery@example.com"
              value={backupEmail}
              disabled={backupLoading}
              onChange={(event) => setBackupEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setBackupEmail(initialBackupEmail)}
              disabled={!backupDirty || backupSaving}
              className="border-gray-300"
            >
              Discard
            </Button>
            <Button onClick={() => void saveBackupEmail()} disabled={!backupDirty || backupSaving}>
              {backupSaving ? 'Saving…' : 'Save backup email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Two-factor authentication</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Add a time-based code (TOTP) from an authenticator app for every sign-in. SMS-based 2FA will arrive
            alongside SMS alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaTotpInlineSection
            subsectionClassName="text-sm font-semibold text-gray-900"
            mutedClassName="text-sm text-gray-500"
            outlineButtonClassName="border-gray-200 bg-white"
            showSecuritySettingsLink={false}
            embedded
          />
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <MonitorSmartphone className="h-5 w-5 text-[#003580]" strokeWidth={1.75} aria-hidden />
            Trusted devices
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Named devices and revoking a single session from a list are planned. Today, use{' '}
            <a href="#settings-password" className="font-medium text-[#003580] underline-offset-2 hover:underline">
              password update
            </a>{' '}
            above to sign out all other sessions at once while staying signed in here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            New sign-ins from unfamiliar devices are logged below when we can detect them. If something looks wrong,
            change your password immediately.
          </p>
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Active sessions</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            This device plus your recent sign-ins. After a password change, other sessions are ended automatically; use
            this list to spot unusual activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <currentDevice.Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.75} aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    {currentDevice.device} · {currentDevice.browser}
                  </p>
                  <p className="text-xs text-emerald-900/80">This device · Active now</p>
                </div>
              </div>
              <span className="self-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-800">
                Current
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Recent sign-ins</p>
            {eventsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : eventsError ? (
              <p className="text-sm text-red-600">{eventsError}</p>
            ) : recentSignIns.length === 0 ? (
              <p className="text-sm text-gray-500">No sign-ins recorded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                {recentSignIns.map((ev) => {
                  const meta = ev.metadata || {}
                  const ua =
                    typeof (meta as Record<string, unknown>).user_agent === 'string'
                      ? ((meta as Record<string, unknown>).user_agent as string)
                      : null
                  const ip =
                    typeof (meta as Record<string, unknown>).ip === 'string'
                      ? ((meta as Record<string, unknown>).ip as string)
                      : null
                  const d = describeUserAgent(ua)
                  return (
                    <li key={ev.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <d.Icon className="h-4 w-4 flex-shrink-0 text-gray-500" strokeWidth={1.75} aria-hidden />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {d.device} · {d.browser}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {formatEventLabel(ev.event_type)}
                            {ip ? ` · IP ${ip}` : ''}
                          </p>
                        </div>
                      </div>
                      <time className="text-xs text-gray-500" dateTime={ev.created_at}>
                        {timeAgo(ev.created_at)}
                      </time>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {otherEvents.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Recent security activity
              </p>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                {otherEvents.map((ev) => (
                  <li key={ev.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-sm text-gray-700">{formatEventLabel(ev.event_type)}</span>
                    <time className="text-xs text-gray-500" dateTime={ev.created_at}>
                      {timeAgo(ev.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" strokeWidth={1.75} aria-hidden />
            <div className="flex-1">
              <p className="font-medium">Something look unfamiliar?</p>
              <p className="mt-0.5 text-xs text-amber-900/90">
                Revoke every session (including this one). You&apos;ll need to sign back in.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void signOutEverywhere()}
              disabled={signOutAllBusy}
              className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            >
              <LogOut className="mr-1 h-4 w-4" strokeWidth={1.75} aria-hidden />
              {signOutAllBusy ? 'Signing out…' : 'Sign out everywhere'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
