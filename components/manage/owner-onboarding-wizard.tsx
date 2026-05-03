'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { OwnerWizardSidebar } from '@/components/manage/owner-wizard-sidebar'
import { OnboardingPackagesPanel } from '@/components/manage/onboarding-packages-panel'
import { GymCountryField } from '@/components/manage/gym-country-field'
import { GymLocationAddressSearch } from '@/components/manage/gym-location-address-search'
import { MfaTotpInlineSection } from '@/components/manage/mfa-totp-inline-section'
import { ReAuthDialog } from '@/components/auth/re-auth-dialog'
import { ArrowRight, CheckCircle2, Info, ShieldCheck } from 'lucide-react'
import {
  buildOnboardingWizardUrl,
  buildWizardStepDeepLink,
  getOwnerWizardStepsForContext,
  resolveWizardStepFromSlug,
  type OnboardingWizardUrlOptions,
} from '@/lib/onboarding/owner-wizard'
import { RESIDENCE_COUNTRIES } from '@/lib/constants/residence-countries'
import { useAuth } from '@/lib/hooks/use-auth'
import type { AccountHolderPropertyRole } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { clearReadinessSessionCache } from '@/lib/onboarding/readiness-session-cache'
import { uploadGymImageWithVariants } from '@/lib/images/gym-image-variants'

const ROLE_OPTIONS: Array<{ value: AccountHolderPropertyRole; label: string }> = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'authorised_operator', label: 'Authorised operator' },
]

const PASSWORD_RULES = [
  'Minimum 10 characters',
  'At least one number',
  'At least one symbol',
  'Avoid common passwords',
]

const ACCOUNT_HOLDER_FINE_PRINT =
  'Your legal name and direct number are used only for identity verification, compliance, trust, and urgent owner contact (for example safety, fraud, chargebacks, or payout issues). We do not use them for marketing, do not sell them, and do not share them for unrelated purposes. We retain them only as long as needed to run your account and meet legal obligations.'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']

/** Browser tooltip (`title`) for the policy preference info control — updates with the current select value. */
const POLICY_PREFERENCE_TOOLTIPS: Record<string, string> = {
  flexible:
    'Flexible: Guests can usually cancel within the window you set on each package. Refunds or credits follow those package rules—strong for traveller trust.',
  moderate:
    'Moderate: Shorter free-cancellation windows and clearer fees than flexible. Balances guest fairness with protecting your capacity.',
  strict:
    'Strict: Firmer cut-offs and higher fees closer to the start date. Suits high demand or limited spots.',
}

type WizardStateResponse = {
  session: { id: string; gym_id: string | null }
  steps: Array<{ step_key: string; completed_at: string | null }>
  active_gym_id: string | null
  gyms: Array<{ id: string; name: string }>
}

type PackagePreviewRow = {
  id: string
  name: string
  description: string | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  currency: string
  offer_type: string | null
  pricing_config: Record<string, unknown> | null
}

export function OwnerOnboardingWizard({ embedInAdmin = false }: { embedInAdmin?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymIdParam = searchParams.get('gym_id')
  const stepSlugParam = searchParams.get('step') || 'step-1'

  const wizardSteps = useMemo(() => getOwnerWizardStepsForContext(embedInAdmin), [embedInAdmin])
  const step = useMemo(
    () => resolveWizardStepFromSlug(stepSlugParam, wizardSteps),
    [stepSlugParam, wizardSteps]
  )

  const { user, profile, loading: authLoading } = useAuth()

  const wizardUrlOptions = useMemo<OnboardingWizardUrlOptions | undefined>(() => {
    if (!embedInAdmin) return undefined
    return { basePath: '/admin/create-gym', adminCreateNewDraft: true }
  }, [embedInAdmin])

  const buildWizUrl = useCallback(
    (stepSlug: string, gymId: string | null) => buildOnboardingWizardUrl(stepSlug, gymId, wizardUrlOptions),
    [wizardUrlOptions]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [activeGymId, setActiveGymId] = useState<string | null>(null)
  const [gyms, setGyms] = useState<Array<{ id: string; name: string }>>([])
  const [completedKeys, setCompletedKeys] = useState<string[]>([])
  const [gymBasics, setGymBasics] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    disciplines: [] as string[],
    google_maps_link: '',
    instagram_link: '',
    facebook_link: '',
  })
  const [offersAccommodation, setOffersAccommodation] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [policyPreference, setPolicyPreference] = useState('flexible')
  const [policyNote, setPolicyNote] = useState('')
  const [packageCount, setPackageCount] = useState<number>(0)
  const [gymCurrency, setGymCurrency] = useState('USD')
  const [packagesPanelOpen, setPackagesPanelOpen] = useState(false)
  const [photoCount, setPhotoCount] = useState<number>(0)
  /** Payout step: Stripe Connect verified OR Wise recipient ready (matches readiness). */
  const [payoutStepComplete, setPayoutStepComplete] = useState<boolean>(false)
  const [payoutRail, setPayoutRail] = useState<'wise' | 'stripe_connect'>('wise')
  const [securityDone, setSecurityDone] = useState<boolean>(false)
  const [packagesPreview, setPackagesPreview] = useState<PackagePreviewRow[]>([])
  const [legalFirstName, setLegalFirstName] = useState('')
  const [legalLastName, setLegalLastName] = useState('')
  const [accountHolderPhone, setAccountHolderPhone] = useState('')
  const [roleAtProperty, setRoleAtProperty] = useState<AccountHolderPropertyRole | ''>('')
  const [countryOfResidence, setCountryOfResidence] = useState('')
  const [showReAuth, setShowReAuth] = useState(false)
  const [selfServeExpired, setSelfServeExpired] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [wizCurrentPassword, setWizCurrentPassword] = useState('')
  const [wizNewPassword, setWizNewPassword] = useState('')
  const [wizConfirmPassword, setWizConfirmPassword] = useState('')
  const [wizPasswordUpdating, setWizPasswordUpdating] = useState(false)
  const [wizPasswordMessage, setWizPasswordMessage] = useState<string | null>(null)
  const [adminVerifyBusy, setAdminVerifyBusy] = useState(false)
  const [adminVerifyMessage, setAdminVerifyMessage] = useState<string | null>(null)

  const fieldClass =
    'border-gray-200 bg-white focus-visible:border-[#003580]/45 focus-visible:ring-[#003580]/20'
  const labelClass = 'text-gray-900'
  const btnGhost =
    'border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900'
  const btnPrimary = 'bg-[#003580] text-white hover:bg-[#002a66] border-0 shadow-sm'

  /** Step panel typography — single scale for onboarding copy */
  const wizH3 = 'text-lg font-bold tracking-tight text-[#003580]'
  const wizSubsection = 'text-base font-semibold tracking-tight text-gray-900'
  const wizLead = 'text-sm font-medium text-gray-900'
  const wizBody = 'text-sm leading-relaxed text-gray-700'
  const wizMuted = 'text-sm leading-relaxed text-gray-600'
  const wizCaption = 'text-xs leading-relaxed text-gray-600'
  const wizHint = 'text-xs leading-relaxed text-muted-foreground'

  const currentIndex = step.index
  const previousStep = wizardSteps.find((item) => item.index === currentIndex - 1) || null
  const nextStep = wizardSteps.find((item) => item.index === currentIndex + 1) || null

  /**
   * Prefer server state, then URL (?gym_id=), then first owned gym — fixes editor links when session lags.
   * In admin “Create new gym” mode we never fall back to an existing owned gym, otherwise the wizard would
   * pull packages / photos / deep-links from an unrelated listing.
   */
  const editorGymId = useMemo(
    () => activeGymId ?? gymIdParam ?? (embedInAdmin ? null : gyms[0]?.id ?? null),
    [activeGymId, gymIdParam, gyms, embedInAdmin]
  )

  const refreshPackagesFromServer = useCallback(async () => {
    const gid = editorGymId
    if (!gid) return
    const supabase = createClient()
    const [{ data: pkgRows }, { count }] = await Promise.all([
      supabase
        .from('packages')
        .select(
          'id, name, description, price_per_day, price_per_week, price_per_month, currency, offer_type, pricing_config'
        )
        .eq('gym_id', gid)
        .order('created_at', { ascending: true })
        .limit(12),
      supabase.from('packages').select('id', { count: 'exact', head: true }).eq('gym_id', gid),
    ])
    setPackagesPreview((pkgRows as PackagePreviewRow[]) ?? [])
    setPackageCount(count || 0)
  }, [editorGymId])

  const accountHolderComplete = useMemo(() => {
    const phoneOk =
      /^[\d\s+().-]+$/.test(accountHolderPhone) && accountHolderPhone.replace(/\D/g, '').length >= 8
    return (
      legalFirstName.trim().length > 0 &&
      legalLastName.trim().length > 0 &&
      phoneOk &&
      Boolean(roleAtProperty) &&
      Boolean(countryOfResidence)
    )
  }, [legalFirstName, legalLastName, accountHolderPhone, roleAtProperty, countryOfResidence])

  useEffect(() => {
    if (!profile) return
    setLegalFirstName(profile.legal_first_name || '')
    setLegalLastName(profile.legal_last_name || '')
    setAccountHolderPhone(profile.account_holder_phone || '')
    setRoleAtProperty((profile.role_at_property as AccountHolderPropertyRole) || '')
    setCountryOfResidence(profile.country_of_residence || '')
  }, [profile])

  useEffect(() => {
    if (!user) {
      setSelfServeExpired(false)
      return
    }
    const onboardingEntry = user.user_metadata?.onboarding_entry
    const expiresAtRaw = user.user_metadata?.onboarding_link_expires_at
    const expiresAtMs =
      typeof expiresAtRaw === 'string' ? new Date(expiresAtRaw).getTime() : Number.NaN
    const expired =
      onboardingEntry === 'self_serve' &&
      Number.isFinite(expiresAtMs) &&
      Date.now() > expiresAtMs
    setSelfServeExpired(expired)
  }, [user])

  useEffect(() => {
    if (authLoading || !profile?.id || profile.country_of_residence) return

    let cancelled = false
    const run = async () => {
      try {
        const response = await fetch('/api/geo/country-hint', { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as { country_code?: string | null }
        if (cancelled || !data.country_code) return
        const match = RESIDENCE_COUNTRIES.find((c) => c.code === data.country_code)
        if (match) {
          setCountryOfResidence((prev) => prev || match.name)
        }
      } catch {
        // optional hint
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [authLoading, profile?.id, profile?.country_of_residence])

  // Re-run loader (and reset form) when admin clicks "Create gym" again with a fresh nonce.
  const adminCreateNonce = embedInAdmin && !gymIdParam ? searchParams.get('t') : null

  useEffect(() => {
    const loadState = async () => {
      setLoading(true)
      setError(null)
      // Clear any stale form state from a previous gym/session before fetching fresh data.
      setActiveGymId(null)
      setSessionId(null)
      setCompletedKeys([])
      setGymBasics({
        name: '',
        description: '',
        address: '',
        city: '',
        country: '',
        latitude: '',
        longitude: '',
        disciplines: [],
        google_maps_link: '',
        instagram_link: '',
        facebook_link: '',
      })
      setOffersAccommodation(false)
      setPayoutStepComplete(false)
      setPayoutRail('wise')
      setPackageCount(0)
      setPhotoCount(0)
      setPackagesPreview([])
      setSecurityDone(false)
      try {
        const selectedGymId = gymIdParam
        const params = new URLSearchParams()
        if (selectedGymId) params.set('gym_id', selectedGymId)
        else if (embedInAdmin) params.set('create_new', '1')
        const qs = params.toString()
        const response = await fetch(
          qs ? `/api/onboarding/wizard/state?${qs}` : '/api/onboarding/wizard/state',
          { cache: 'no-store' }
        )
        const data = (await response.json()) as WizardStateResponse & { error?: string }
        if (!response.ok) {
          setError(data.error || 'Failed to load wizard state')
          setLoading(false)
          return
        }

        setSessionId(data.session.id)
        setActiveGymId(data.active_gym_id || data.session.gym_id || null)
        setGyms(data.gyms || [])
        const completed = (data.steps || [])
          .filter((item) => item.completed_at)
          .map((item) => item.step_key)
        setCompletedKeys(completed)

        const gymId = data.active_gym_id || data.session.gym_id || null
        if (gymId) {
          const supabase = createClient()
          const { data: gym } = await supabase
            .from('gyms')
            .select(
              'name, description, address, city, country, latitude, longitude, disciplines, stripe_connect_verified, currency, offers_accommodation, google_maps_link, instagram_link, facebook_link, payout_rail, wise_payout_ready, wise_recipient_id, wise_recipient_currency'
            )
            .eq('id', gymId)
            .maybeSingle()
          if (gym) {
            const rawName = gym.name || ''
            const g = gym as typeof gym & {
              google_maps_link?: string | null
              instagram_link?: string | null
              facebook_link?: string | null
            }
            if (typeof gym.currency === 'string' && gym.currency.trim()) {
              setGymCurrency(gym.currency.trim().toUpperCase())
            }
            const gGeo = gym as typeof gym & { latitude?: number | null; longitude?: number | null }
            setGymBasics({
              name: rawName === 'Draft Gym' ? '' : rawName,
              description: gym.description || '',
              address: gym.address || '',
              city: gym.city || '',
              country: gym.country || '',
              latitude:
                gGeo.latitude != null && !Number.isNaN(Number(gGeo.latitude)) ? String(gGeo.latitude) : '',
              longitude:
                gGeo.longitude != null && !Number.isNaN(Number(gGeo.longitude)) ? String(gGeo.longitude) : '',
              disciplines: Array.isArray(gym.disciplines) ? gym.disciplines : [],
              google_maps_link: g.google_maps_link || '',
              instagram_link: g.instagram_link || '',
              facebook_link: g.facebook_link || '',
            })
            setOffersAccommodation(Boolean((gym as { offers_accommodation?: boolean }).offers_accommodation))
            const pr = (gym as { payout_rail?: string | null }).payout_rail
            const rail: 'wise' | 'stripe_connect' = pr === 'stripe_connect' ? 'stripe_connect' : 'wise'
            setPayoutRail(rail)
            const payoutsOk =
              rail === 'stripe_connect'
                ? Boolean(gym.stripe_connect_verified)
                : Boolean(
                    (gym as { wise_payout_ready?: boolean }).wise_payout_ready &&
                      (gym as { wise_recipient_id?: string | null }).wise_recipient_id
                  )
            setPayoutStepComplete(payoutsOk)
          }

          const [{ count: packages }, { count: photos }] = await Promise.all([
            supabase
              .from('packages')
              .select('id', { count: 'exact', head: true })
              .eq('gym_id', gymId),
            supabase
              .from('gym_images')
              .select('id', { count: 'exact', head: true })
              .eq('gym_id', gymId),
          ])

          setPackageCount(packages || 0)
          setPhotoCount(photos || 0)

          const { data: pkgRows } = await supabase
            .from('packages')
            .select(
              'id, name, description, price_per_day, price_per_week, price_per_month, currency, offer_type, pricing_config'
            )
            .eq('gym_id', gymId)
            .order('created_at', { ascending: true })
            .limit(12)
          setPackagesPreview((pkgRows as PackagePreviewRow[]) ?? [])
        }

        setSecurityDone(completed.includes('security'))
      } catch (loadError: any) {
        setError(loadError?.message || 'Failed to load wizard state')
      } finally {
        setLoading(false)
      }
    }

    void loadState()
  }, [gymIdParam, embedInAdmin, adminCreateNonce])

  useEffect(() => {
    if (step.key !== 'packages' || !editorGymId) return
    void refreshPackagesFromServer()
  }, [step.key, editorGymId, refreshPackagesFromServer])

  const gymListingLocationComplete = useMemo(
    () =>
      Boolean(
        gymBasics.address.trim() &&
          gymBasics.city.trim() &&
          gymBasics.country.trim() &&
          gymBasics.disciplines.length > 0
      ),
    [gymBasics.address, gymBasics.city, gymBasics.country, gymBasics.disciplines]
  )

  const basicsMergedComplete = useMemo(() => {
    if (embedInAdmin) {
      return completedKeys.includes('basics')
    }
    return (
      completedKeys.includes('basics') &&
      (completedKeys.includes('disciplines') || gymListingLocationComplete)
    )
  }, [embedInAdmin, completedKeys, gymListingLocationComplete])

  const stepIsComplete = useMemo(() => {
    if (step.key === 'basics') {
      if (embedInAdmin) return completedKeys.includes('basics')
      return basicsMergedComplete
    }
    if (embedInAdmin && step.key === 'security') {
      return completedKeys.includes('security')
    }
    return completedKeys.includes(step.key)
  }, [step.key, embedInAdmin, basicsMergedComplete, completedKeys])

  const coreStepsCompleteCount = useMemo(() => {
    let n = basicsMergedComplete ? 1 : 0
    for (const k of ['packages', 'photos', 'payouts', 'security'] as const) {
      if (completedKeys.includes(k)) n += 1
    }
    return n
  }, [basicsMergedComplete, completedKeys])

  const verificationSummary = useMemo(() => {
    const emailVerified = Boolean(user?.email_confirmed_at)
    const needsEmail = !emailVerified
    const needsAccountHolder = !accountHolderComplete
    const packagesOk = packageCount > 0
    const photosOk = photoCount >= 3
    const payoutsOk = payoutStepComplete
    const securityOk = embedInAdmin ? true : completedKeys.includes('security')

    const coreOkCount = [packagesOk, photosOk, payoutsOk, securityOk].filter(Boolean).length

    return {
      emailVerified,
      needsEmail,
      needsAccountHolder,
      packagesOk,
      photosOk,
      payoutsOk,
      securityOk,
      coreOkCount,
    }
  }, [
    user?.email_confirmed_at,
    accountHolderComplete,
    packageCount,
    photoCount,
    payoutStepComplete,
    completedKeys,
    embedInAdmin,
  ])

  const finalReadinessItems = useMemo(
    () => [
      {
        key: 'listing',
        label: 'Listing profile',
        detail: 'Gym basics, location, disciplines, and account holder details.',
        ready: basicsMergedComplete,
      },
      {
        key: 'packages',
        label: 'Packages & pricing',
        detail: packageCount > 0 ? `${packageCount} package${packageCount === 1 ? '' : 's'} created.` : 'Create at least one bookable package.',
        ready: packageCount > 0,
      },
      {
        key: 'photos',
        label: 'Photos',
        detail: `${photoCount} uploaded · at least 3 recommended before go-live.`,
        ready: photoCount >= 3,
      },
      {
        key: 'payouts',
        label: 'Payouts',
        detail: payoutStepComplete
          ? payoutRail === 'stripe_connect'
            ? 'Stripe Connect is ready.'
            : 'Wise payout details are on file.'
          : payoutRail === 'stripe_connect'
            ? 'Finish Stripe Connect so completed bookings can be paid out.'
            : 'Add Wise payout details (or switch to Stripe Connect in payout setup).',
        ready: payoutStepComplete,
      },
      {
        key: 'security',
        label: 'Security',
        detail: verificationSummary.securityOk
          ? 'Owner account security is complete.'
          : 'Finish account holder, email verification, and security setup.',
        ready: verificationSummary.securityOk,
      },
    ],
    [
      basicsMergedComplete,
      packageCount,
      photoCount,
      payoutStepComplete,
      payoutRail,
      verificationSummary.securityOk,
    ]
  )

  const goToWizardStep = useCallback(
    (stepNumber: number) => {
      const targetStep = wizardSteps.find((item) => item.index === stepNumber)
      if (!targetStep) return
      const gymIdForUrl = editorGymId ?? gymIdParam ?? null
      router.push(buildWizUrl(targetStep.slug, gymIdForUrl), { scroll: false })
    },
    [buildWizUrl, editorGymId, gymIdParam, router, wizardSteps]
  )

  const isMigratedStep = step.key === 'basics'

  type BasicSubStepDef = { key: string; title: string; subtitle: string }
  const basicSubSteps = useMemo<BasicSubStepDef[]>(() => {
    if (embedInAdmin) {
      return [
        {
          key: 'identity',
          title: 'About this gym',
          subtitle: 'Just the gym name is required to create a draft. Description is optional.',
        },
        {
          key: 'location',
          title: 'Location & offering',
          subtitle: 'Optional for admin drafts — owners can fill these in later from the editor.',
        },
      ]
    }
    return [
      {
        key: 'identity',
        title: 'About your gym',
        subtitle: 'How travellers will recognise you in search and on your listing.',
      },
      {
        key: 'location',
        title: 'Location & what you teach',
        subtitle: 'Where guests will train, plus the disciplines on offer.',
      },
      {
        key: 'trust',
        title: 'Help travellers trust your gym',
        subtitle: 'Add a couple of links so we can verify your gym is real. You can add these later, but trust signals help guests book sooner.',
      },
      {
        key: 'holder',
        title: "Who's responsible for this listing",
        subtitle: 'We hold these details on record for compliance and urgent owner contact — separate from your public gym contact.',
      },
    ]
  }, [embedInAdmin])
  const totalBasicSubSteps = basicSubSteps.length
  const [basicSubStep, setBasicSubStep] = useState(1)
  useEffect(() => {
    if (step.key !== 'basics') setBasicSubStep(1)
  }, [step.key])
  useEffect(() => {
    if (basicSubStep > totalBasicSubSteps) setBasicSubStep(totalBasicSubSteps)
  }, [basicSubStep, totalBasicSubSteps])

  const validateBasicSubStep = useCallback(
    (n: number): string | null => {
      const def = basicSubSteps[n - 1]
      if (!def) return null
      if (def.key === 'identity') {
        if (!gymBasics.name.trim()) return 'Gym name is required'
        if (!embedInAdmin && !gymBasics.description.trim()) return 'Description is required'
        return null
      }
      if (def.key === 'location') {
        if (embedInAdmin) return null
        if (!gymBasics.address.trim() || !gymBasics.city.trim() || !gymBasics.country.trim()) {
          return 'Address, city, and country are required'
        }
        if (gymBasics.disciplines.length === 0) return 'Select at least one discipline'
        return null
      }
      if (def.key === 'trust') {
        return null
      }
      if (def.key === 'holder') {
        if (!accountHolderComplete || !roleAtProperty) {
          return 'Complete all account holder fields: legal name, direct phone, role, and country of residence.'
        }
        if (!user?.email_confirmed_at) return 'Verify your email from the link we sent you, then continue.'
        if (selfServeExpired) {
          return 'Your self-serve verification link has expired (24h). Request a new link from list-your-gym to continue.'
        }
        return null
      }
      return null
    },
    [
      basicSubSteps,
      gymBasics.name,
      gymBasics.description,
      gymBasics.address,
      gymBasics.city,
      gymBasics.country,
      gymBasics.disciplines,
      embedInAdmin,
      accountHolderComplete,
      roleAtProperty,
      user?.email_confirmed_at,
      selfServeExpired,
    ]
  )

  const handleBasicContinue = () => {
    setError(null)
    setResendMessage(null)
    const err = validateBasicSubStep(basicSubStep)
    if (err) {
      setError(err)
      return
    }
    if (basicSubStep < totalBasicSubSteps) {
      setBasicSubStep((s) => s + 1)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }
    startBasicInfoSubmit()
  }

  const handleBasicBack = () => {
    setError(null)
    if (basicSubStep > 1) {
      setBasicSubStep((s) => s - 1)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }
  const hasDedicatedStepContent = [
    'basics',
    'packages',
    'photos',
    'policy',
    'payouts',
    'security',
    'finalize',
  ].includes(step.key)

  const saveStepCompletion = async (completed: boolean) => {
    if (!sessionId) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/wizard/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          step_key: step.key,
          completed,
          metadata: {
            source: 'owner_wizard_step_page',
            slug: step.slug,
          },
          gym_id: editorGymId ?? activeGymId,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to save step')
        setSaving(false)
        return
      }

      flushSync(() => {
        setCompletedKeys((prev) => {
          if (completed) return Array.from(new Set([...prev, step.key]))
          return prev.filter((key) => key !== step.key)
        })
      })

      if (completed && nextStep) {
        router.push(buildWizUrl(nextStep.slug, editorGymId), { scroll: false })
      } else if (completed && step.key === 'finalize' && !embedInAdmin) {
        const gid = editorGymId ?? activeGymId
        if (gid) {
          router.push(`/manage/onboarding/complete?gym_id=${encodeURIComponent(gid)}`, { scroll: false })
        }
      }
    } catch (saveError: any) {
      setError(saveError?.message || 'Failed to save step')
    } finally {
      setSaving(false)
    }
  }

  const ensureActiveGym = async () => {
    if (activeGymId) return activeGymId
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) throw new Error('Unauthorized')

    if (gymIdParam) {
      if (profile?.role === 'admin') {
        const { data: exists } = await supabase.from('gyms').select('id').eq('id', gymIdParam).maybeSingle()
        if (exists?.id) {
          setActiveGymId(exists.id)
          return exists.id
        }
      } else {
        const { data: owned } = await supabase
          .from('gyms')
          .select('id')
          .eq('id', gymIdParam)
          .eq('owner_id', user.id)
          .maybeSingle()
        if (owned?.id) {
          setActiveGymId(owned.id)
          return owned.id
        }
      }
    }
    // In the admin "Create new gym" embed, never adopt an existing owned listing here —
    // the next insert below creates a brand new draft for this session.
    if (!embedInAdmin) {
      const firstOwned = gyms[0]?.id
      if (firstOwned) {
        setActiveGymId(firstOwned)
        return firstOwned
      }
    }

    const mapsLink = gymBasics.google_maps_link.trim() || null
    const igLink = gymBasics.instagram_link.trim() || null
    const fbLink = gymBasics.facebook_link.trim() || null

    const cityForInsert = gymBasics.city.trim() || (embedInAdmin ? 'Pending' : '')
    const countryForInsert = gymBasics.country.trim() || (embedInAdmin ? 'Pending' : '')
    const disciplinesForInsert =
      gymBasics.disciplines.length > 0 ? gymBasics.disciplines : embedInAdmin ? ([] as string[]) : gymBasics.disciplines
    const latNum = parseFloat(gymBasics.latitude.trim())
    const lngNum = parseFloat(gymBasics.longitude.trim())
    const latitudeForInsert = Number.isFinite(latNum) ? latNum : null
    const longitudeForInsert = Number.isFinite(lngNum) ? lngNum : null

    const { data: createdGym, error: createError } = await supabase
      .from('gyms')
      .insert({
        owner_id: user.id,
        name: gymBasics.name.trim(),
        description: gymBasics.description.trim() || null,
        address: gymBasics.address.trim() || null,
        city: cityForInsert,
        country: countryForInsert,
        latitude: latitudeForInsert,
        longitude: longitudeForInsert,
        disciplines: disciplinesForInsert,
        offers_accommodation: offersAccommodation,
        google_maps_link: mapsLink,
        instagram_link: igLink,
        facebook_link: fbLink,
        amenities: {},
        status: 'pending',
        verification_status: 'draft',
        stripe_connect_verified: false,
        admin_approved: false,
        price_per_day: 0,
        currency: 'USD',
      })
      .select('id, name')
      .single()

    if (createError || !createdGym) {
      throw new Error('Failed to create draft gym')
    }

    setActiveGymId(createdGym.id)
    setGyms((prev) => [{ id: createdGym.id, name: createdGym.name }, ...prev])
    return createdGym.id
  }

  const openPackageEditor = async () => {
    setError(null)
    try {
      await ensureActiveGym()
      setPackagesPanelOpen(true)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : embedInAdmin
            ? 'Could not open packages. Add a gym name on Basic Info and save first.'
            : 'Could not open packages. Complete Basic Info (name, location, disciplines) first, then try again.'
      )
    }
  }

  const submitAdminBasicsQuick = async () => {
    if (!sessionId) {
      setError('Wizard session not ready. Refresh the page and try again.')
      return
    }
    if (!gymBasics.name.trim()) {
      setError('Gym name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const gymId = await ensureActiveGym()
      const supabase = createClient()
      const mapsLink = gymBasics.google_maps_link.trim() || null
      const igLink = gymBasics.instagram_link.trim() || null
      const fbLink = gymBasics.facebook_link.trim() || null

      const latA = parseFloat(gymBasics.latitude.trim())
      const lngA = parseFloat(gymBasics.longitude.trim())
      const { error: updateError } = await supabase
        .from('gyms')
        .update({
          name: gymBasics.name.trim(),
          description: gymBasics.description.trim() || null,
          address: gymBasics.address.trim() || null,
          city: gymBasics.city.trim() || 'Pending',
          country: gymBasics.country.trim() || 'Pending',
          latitude: Number.isFinite(latA) ? latA : null,
          longitude: Number.isFinite(lngA) ? lngA : null,
          disciplines: gymBasics.disciplines.length > 0 ? gymBasics.disciplines : [],
          offers_accommodation: offersAccommodation,
          google_maps_link: mapsLink,
          instagram_link: igLink,
          facebook_link: fbLink,
        })
        .eq('id', gymId)
      if (updateError) {
        setError('Failed to save gym listing')
        return
      }

      clearReadinessSessionCache()

      const wRes = await fetch('/api/onboarding/wizard/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          step_key: 'basics',
          completed: true,
          metadata: { source: 'admin_embed_wizard_basic_info', slug: 'step-1' },
          gym_id: gymId,
        }),
      })
      const wData = (await wRes.json()) as { error?: string }
      if (!wRes.ok) {
        setError(wData.error || 'Failed to mark Basic Info complete')
        return
      }

      flushSync(() => {
        setSecurityDone(true)
        setCompletedKeys((prev) => Array.from(new Set([...prev, 'basics', 'security'])))
      })

      const packagesStep = wizardSteps.find((s) => s.key === 'packages')
      if (packagesStep) {
        router.push(buildWizUrl(packagesStep.slug, gymId), { scroll: false })
      }
    } catch (basicErr: unknown) {
      setError(basicErr instanceof Error ? basicErr.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const runAdminVerifyGym = useCallback(async () => {
    const gid = editorGymId ?? activeGymId
    if (!gid) {
      setAdminVerifyMessage('Save Basic Info first so the gym exists.')
      return
    }
    setAdminVerifyBusy(true)
    setAdminVerifyMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/gyms/${encodeURIComponent(gid)}/verify`, { method: 'POST' })
      const data = (await res.json()) as { error?: string; message?: string }
      if (!res.ok) {
        setAdminVerifyMessage(data?.error || 'Verification failed')
        return
      }
      setAdminVerifyMessage(data?.message ?? 'Gym verified successfully.')
    } catch (e) {
      setAdminVerifyMessage(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setAdminVerifyBusy(false)
    }
  }, [editorGymId, activeGymId])

  const startBasicInfoSubmit = () => {
    setError(null)
    setResendMessage(null)
    if (!sessionId) {
      setError('Wizard session not ready. Refresh the page and try again.')
      return
    }
    if (embedInAdmin) {
      void submitAdminBasicsQuick()
      return
    }
    if (!gymBasics.name.trim() || !gymBasics.description.trim()) {
      setError('Gym name and description are required')
      return
    }
    if (!gymBasics.address.trim() || !gymBasics.city.trim() || !gymBasics.country.trim()) {
      setError('Address, city, and country are required')
      return
    }
    if (gymBasics.disciplines.length === 0) {
      setError('Select at least one discipline')
      return
    }
    if (!accountHolderComplete || !roleAtProperty) {
      setError('Complete all account holder fields: legal name, direct phone, role, and country of residence.')
      return
    }
    if (!user?.email_confirmed_at) {
      setError('Verify your email from the link we sent you, then continue.')
      return
    }
    if (selfServeExpired) {
      setError(
        'Your self-serve verification link has expired (24h). Request a new link from list-your-gym to continue.'
      )
      return
    }
    setShowReAuth(true)
  }

  const finalizeBasicInfoAfterReauth = async () => {
    if (!sessionId) return
    setSaving(true)
    setError(null)
    try {
      if (!gymBasics.name.trim() || !gymBasics.description.trim()) {
        setError('Gym name and description are required')
        return
      }
      if (!gymBasics.address.trim() || !gymBasics.city.trim() || !gymBasics.country.trim()) {
        setError('Address, city, and country are required')
        return
      }
      if (gymBasics.disciplines.length === 0) {
        setError('Select at least one discipline')
        return
      }
      const gymId = await ensureActiveGym()
      const supabase = createClient()
      const mapsLink = gymBasics.google_maps_link.trim() || null
      const igLink = gymBasics.instagram_link.trim() || null
      const fbLink = gymBasics.facebook_link.trim() || null

      const latU = parseFloat(gymBasics.latitude.trim())
      const lngU = parseFloat(gymBasics.longitude.trim())
      const { error: updateError } = await supabase
        .from('gyms')
        .update({
          name: gymBasics.name.trim(),
          description: gymBasics.description.trim(),
          address: gymBasics.address.trim(),
          city: gymBasics.city.trim(),
          country: gymBasics.country.trim(),
          latitude: Number.isFinite(latU) ? latU : null,
          longitude: Number.isFinite(lngU) ? lngU : null,
          disciplines: gymBasics.disciplines,
          offers_accommodation: offersAccommodation,
          google_maps_link: mapsLink,
          instagram_link: igLink,
          facebook_link: fbLink,
        })
        .eq('id', gymId)
      if (updateError) {
        setError('Failed to save gym listing')
        return
      }

      clearReadinessSessionCache()

      const secRes = await fetch('/api/onboarding/security/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_first_name: legalFirstName.trim(),
          legal_last_name: legalLastName.trim(),
          account_holder_phone: accountHolderPhone.trim(),
          role_at_property: roleAtProperty,
          country_of_residence: countryOfResidence,
        }),
      })
      const secData = (await secRes.json()) as { error?: string }
      if (!secRes.ok) {
        setError(secData.error || 'Failed to save account holder details')
        return
      }

      const wRes = await fetch('/api/onboarding/wizard/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          step_key: 'basics',
          completed: true,
          metadata: { source: 'owner_wizard_basic_info', slug: 'step-1' },
          gym_id: gymId,
        }),
      })
      const wData = (await wRes.json()) as { error?: string }
      if (!wRes.ok) {
        setError(wData.error || 'Failed to mark Basic Info complete')
        return
      }

      flushSync(() => {
        setSecurityDone(true)
        setCompletedKeys((prev) => Array.from(new Set([...prev, 'security', 'basics'])))
      })

      const packagesStep = wizardSteps.find((s) => s.key === 'packages')
      if (packagesStep) {
        router.push(buildWizUrl(packagesStep.slug, gymId), { scroll: false })
      }
    } catch (basicErr: unknown) {
      setError(basicErr instanceof Error ? basicErr.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleResendVerificationEmail = async () => {
    if (!user?.email) return
    setResendLoading(true)
    setResendMessage(null)
    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })
      if (resendError) {
        setResendMessage(resendError.message)
      } else {
        setResendMessage('Check your inbox for a new verification link.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleWizardPasswordUpdate = async () => {
    setWizPasswordMessage(null)
    setError(null)
    if (wizNewPassword !== wizConfirmPassword) {
      setError('New password and confirmation do not match')
      return
    }
    setWizPasswordUpdating(true)
    try {
      const response = await fetch('/api/auth/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: wizCurrentPassword,
          new_password: wizNewPassword,
        }),
      })
      const data = (await response.json()) as { error?: string; details?: string[] }
      if (!response.ok) {
        if (Array.isArray(data.details) && data.details.length > 0) {
          setError(data.details.join('. '))
        } else {
          setError(data.error || 'Failed to update password')
        }
        return
      }
      setWizCurrentPassword('')
      setWizNewPassword('')
      setWizConfirmPassword('')
      setWizPasswordMessage('Password updated.')
    } catch (pwErr: unknown) {
      setError(pwErr instanceof Error ? pwErr.message : 'Failed to update password')
    } finally {
      setWizPasswordUpdating(false)
    }
  }

  const uploadPhotosForActiveGym = async () => {
    if (photoFiles.length === 0) {
      setError('Select at least one photo to upload')
      return
    }

    const gymId = await ensureActiveGym()
    const supabase = createClient()

    const uploads = await Promise.all(
      photoFiles.map(async (file, index) => {
        try {
          const uploaded = await uploadGymImageWithVariants({
            supabase,
            gymId,
            file,
            stem: `${Date.now()}-${index}`,
          })
          return { gym_id: gymId, url: uploaded.url, variants: uploaded.variants, order: photoCount + index }
        } catch {
          return null
        }
      })
    )

    const valid = uploads.filter(Boolean) as Array<{
      gym_id: string
      url: string
      variants: Record<string, string>
      order: number
    }>
    if (valid.length === 0) {
      setError('Failed to upload photos')
      return
    }

    const { error: insertError } = await supabase
      .from('gym_images')
      .insert(valid)
    if (insertError) {
      setError('Failed to save uploaded photos')
      return
    }

    const nextCount = photoCount + valid.length
    setPhotoCount(nextCount)
    setPhotoFiles([])
    if (nextCount >= 3) {
      await saveStepCompletion(true)
    }
  }

  const savePolicyPreference = async () => {
    if (!sessionId) return
    await saveStepCompletion(true)
    const supabase = createClient()
    await supabase
      .from('owner_onboarding_steps')
      .upsert(
        {
          session_id: sessionId,
          step_key: 'policy',
          completed_at: new Date().toISOString(),
          metadata: {
            policy_preference: policyPreference,
            policy_note: policyNote || null,
          },
        },
        { onConflict: 'session_id,step_key' }
      )
  }

  const refreshPayoutStatus = async () => {
    const gymId = await ensureActiveGym()
    const supabase = createClient()
    const { data: row } = await supabase
      .from('gyms')
      .select('payout_rail, stripe_connect_verified, wise_payout_ready, wise_recipient_id')
      .eq('id', gymId)
      .maybeSingle()
    const rail: 'wise' | 'stripe_connect' =
      row?.payout_rail === 'stripe_connect' ? 'stripe_connect' : 'wise'
    setPayoutRail(rail)

    if (rail === 'stripe_connect') {
      const response = await fetch(`/api/gyms/${gymId}/update-stripe-status`, { method: 'POST' })
      if (!response.ok) {
        setError('Failed to refresh Stripe status')
        return
      }
      const data = await response.json()
      const ok = Boolean(data.verified)
      setPayoutStepComplete(ok)
      if (ok) await saveStepCompletion(true)
      return
    }

    const ok = Boolean(row?.wise_payout_ready && row?.wise_recipient_id)
    setPayoutStepComplete(ok)
    if (ok) await saveStepCompletion(true)
  }

  const checkStepCompletionFromData = async () => {
    const gymId = await ensureActiveGym()
    const supabase = createClient()

    if (step.key === 'packages') {
      const { count } = await supabase
        .from('packages')
        .select('id', { count: 'exact', head: true })
        .eq('gym_id', gymId)
      const ok = (count || 0) > 0
      setPackageCount(count || 0)
      if (ok && sessionId) {
        await supabase
          .from('owner_onboarding_steps')
          .upsert(
            {
              session_id: sessionId,
              step_key: 'pricing_ack',
              completed_at: new Date().toISOString(),
              metadata: { source: 'wizard_step_validation' },
            },
            { onConflict: 'session_id,step_key' }
          )
      }
      return ok
    }

    if (step.key === 'photos') {
      const { count } = await supabase
        .from('gym_images')
        .select('id', { count: 'exact', head: true })
        .eq('gym_id', gymId)
      setPhotoCount(count || 0)
      return (count || 0) >= 3
    }

    if (step.key === 'payouts') {
      const { data } = await supabase
        .from('gyms')
        .select('payout_rail, stripe_connect_verified, wise_payout_ready, wise_recipient_id')
        .eq('id', gymId)
        .maybeSingle()
      const rail: 'wise' | 'stripe_connect' =
        data?.payout_rail === 'stripe_connect' ? 'stripe_connect' : 'wise'
      setPayoutRail(rail)
      const ok =
        rail === 'stripe_connect'
          ? Boolean(data?.stripe_connect_verified)
          : Boolean(data?.wise_payout_ready && data?.wise_recipient_id)
      setPayoutStepComplete(ok)
      return ok
    }

    if (step.key === 'security') {
      if (embedInAdmin) return true
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) return false
      const { data } = await supabase
        .from('owner_onboarding_steps')
        .select('completed_at, owner_onboarding_sessions!inner(owner_id)')
        .eq('step_key', 'security')
        .eq('owner_onboarding_sessions.owner_id', user.id)
        .not('completed_at', 'is', null)
        .limit(1)
      return Boolean(data && data.length > 0)
    }

    if (step.key === 'policy') {
      return true
    }

    if (step.key === 'finalize') {
      if (embedInAdmin) return true
      const core = ['packages', 'photos', 'payouts', 'security'] as const
      return basicsMergedComplete && core.every((key) => completedKeys.includes(key))
    }

    return false
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] px-4 py-8 sm:px-6 md:py-12 lg:px-10">
        <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-xl border border-gray-200/90 bg-white p-8 shadow-md md:p-10">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:justify-between">
            <div className="h-7 w-56 animate-pulse rounded-md bg-gray-200" />
            <div className="h-5 w-28 animate-pulse rounded-md bg-gray-200" />
          </div>
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="space-y-4 lg:w-[280px] lg:shrink-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-4 flex-1 animate-pulse rounded-md bg-gray-200" />
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-9 w-3/4 max-w-md animate-pulse rounded-md bg-gray-200" />
              <div className="h-20 max-w-xl animate-pulse rounded-md bg-gray-200" />
              <div className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatPackagePrice = (pkg: PackagePreviewRow) => {
    const code = (pkg.currency || 'USD').toUpperCase()
    const label = (amount: number, tail: string) => `$${Number(amount).toLocaleString()}${tail} ${code}`

    if (pkg.price_per_month != null && Number(pkg.price_per_month) > 0) {
      return label(pkg.price_per_month, '/mo')
    }
    if (pkg.price_per_week != null && Number(pkg.price_per_week) > 0) {
      return label(pkg.price_per_week, '/wk')
    }
    if (pkg.price_per_day != null && Number(pkg.price_per_day) > 0) {
      return label(pkg.price_per_day, '/day')
    }

    const raw = pkg.pricing_config
    if (raw && typeof raw === 'object' && raw !== null && 'mode' in raw) {
      const pc = raw as {
        mode?: string
        durations?: Array<{ days?: number | string; price?: number }>
        rates?: { daily?: number | null; weekly?: number | null; monthly?: number | null }
      }
      if (pc.mode === 'fixed' && Array.isArray(pc.durations)) {
        const prices = pc.durations
          .map((d) => (typeof d.price === 'number' ? d.price : Number(d.price)))
          .filter((p) => Number.isFinite(p) && p > 0)
        if (prices.length > 0) {
          const min = Math.min(...prices)
          return prices.length > 1 ? `From ${label(min, '')}` : label(min, '')
        }
      }
      if (pc.mode === 'rate' && pc.rates && typeof pc.rates === 'object') {
        const parts: string[] = []
        const { daily, weekly, monthly } = pc.rates
        if (typeof daily === 'number' && daily > 0) parts.push(label(daily, '/day'))
        if (typeof weekly === 'number' && weekly > 0) parts.push(label(weekly, '/wk'))
        if (typeof monthly === 'number' && monthly > 0) parts.push(label(monthly, '/mo'))
        if (parts.length > 0) return parts.join(' · ')
      }
    }

    return 'Set in editor'
  }

  const completedStepCount = wizardSteps.filter((s) => completedKeys.includes(s.key)).length
  const progressPct = Math.round((completedStepCount / wizardSteps.length) * 100)
  const heroTitle = embedInAdmin ? 'Create a new gym listing' : 'List your gym'
  const heroSubtitle = embedInAdmin
    ? 'Create a draft on behalf of an owner. Only the gym name is required to start — anything else can be added now or later in the editor.'
    : "Tell travellers about your gym so they can find, trust, and book you. Save anytime — we'll keep your draft until you're ready to go live."

  return (
    <div
      className={
        embedInAdmin
          ? 'min-h-0 px-2 py-4 sm:px-4 md:py-6'
          : 'min-h-screen bg-white pb-32'
      }
    >
      <main
        className={
          embedInAdmin
            ? 'mx-auto w-full max-w-6xl overflow-visible'
            : 'mx-auto w-full max-w-6xl overflow-visible px-4 pt-10 sm:px-6 sm:pt-14 lg:pt-16'
        }
        aria-label="Gym listing onboarding"
      >
        {!embedInAdmin ? (
          <header className="mb-10 max-w-3xl sm:mb-12">
            <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight text-gray-900 sm:text-[30px]">
              {heroTitle}
            </h1>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-gray-600">{heroSubtitle}</p>

            <div className="mt-6 flex items-center gap-4">
              <div
                className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Onboarding progress"
              >
                <div
                  className="h-full rounded-full bg-[#003580] transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="shrink-0 text-[12px] font-medium tabular-nums text-gray-500" aria-live="polite">
                Step {step.index} of {wizardSteps.length} · {progressPct}%
              </p>
            </div>
          </header>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-start lg:gap-16 xl:gap-20">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <OwnerWizardSidebar
              steps={wizardSteps}
              currentIndex={step.index}
              completedKeys={completedKeys}
              onStepClick={goToWizardStep}
            />
          </aside>

          <div className="min-w-0">
            {step.key !== 'basics' ? (
              <div className="mb-6">
                <h2 className="text-[20px] font-semibold tracking-tight text-gray-900 sm:text-[22px]">
                  {step.label}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            ) : null}

            <div className="space-y-6">
              <div className="space-y-7 rounded-2xl border border-gray-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:space-y-9 md:p-10">
                {step.key === 'basics' && (
                  <div className="space-y-7">
                    <div>
                      {totalBasicSubSteps > 1 ? (
                        <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#003580]">
                          {step.label} · Step {basicSubStep} of {totalBasicSubSteps}
                        </p>
                      ) : (
                        <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#003580]">
                          {step.label}
                        </p>
                      )}
                      <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight text-gray-900 sm:text-[26px]">
                        {basicSubSteps[basicSubStep - 1]?.title}
                      </h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
                        {basicSubSteps[basicSubStep - 1]?.subtitle}
                      </p>
                    </div>

                    {basicSubSteps[basicSubStep - 1]?.key === 'identity' && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label className={labelClass} htmlFor="wiz-gym-name">Gym name *</Label>
                          <Input
                            id="wiz-gym-name"
                            className={fieldClass}
                            value={gymBasics.name}
                            placeholder="e.g. Tiger Muay Thai"
                            onChange={(event) => setGymBasics((prev) => ({ ...prev, name: event.target.value }))}
                          />
                          <p className={wizHint}>Use the name guests will recognise from your signage and socials.</p>
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass} htmlFor="wiz-gym-desc">
                            {embedInAdmin ? 'Description (optional)' : 'Description *'}
                          </Label>
                          <Textarea
                            id="wiz-gym-desc"
                            className={fieldClass}
                            rows={5}
                            placeholder="A short paragraph: what makes your gym special, who it suits, what a typical day looks like."
                            value={gymBasics.description}
                            onChange={(event) => setGymBasics((prev) => ({ ...prev, description: event.target.value }))}
                          />
                          <p className={wizHint}>2–4 sentences works best. You can polish this later.</p>
                        </div>
                      </div>
                    )}

                    {basicSubSteps[basicSubStep - 1]?.key === 'location' && (
                      <div className="space-y-5">
                        <GymLocationAddressSearch
                          disabled={saving}
                          onApply={({ address, city, latitude, longitude, country }) => {
                            setGymBasics((prev) => ({
                              ...prev,
                              address,
                              city,
                              latitude,
                              longitude,
                              country: country || prev.country,
                            }))
                          }}
                        />
                        <div className="space-y-2">
                          <Label className={labelClass} htmlFor="wiz-address">
                            {embedInAdmin ? 'Address (optional)' : 'Address *'}
                          </Label>
                          <Input
                            id="wiz-address"
                            className={fieldClass}
                            placeholder="Street address"
                            value={gymBasics.address}
                            onChange={(event) => setGymBasics((prev) => ({ ...prev, address: event.target.value }))}
                          />
                          <p className={wizHint}>
                            Use map search above to set a normalized city name, or edit the line after you pick.
                          </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className={labelClass} htmlFor="wiz-city">
                              {embedInAdmin ? 'City (optional)' : 'City *'}
                            </Label>
                            <Input
                              id="wiz-city"
                              className={fieldClass}
                              value={gymBasics.city}
                              onChange={(event) =>
                                setGymBasics((prev) => ({ ...prev, city: event.target.value }))
                              }
                              title="Prefilled from map search; edit if you prefer a better-known area name"
                            />
                            <p className={wizHint}>
                              Prefilled from map search; edit if you want a broader name guests search for (e.g. Krabi
                              vs Ko Lanta).
                            </p>
                          </div>
                          <GymCountryField
                            id="wiz-gym-country"
                            label={embedInAdmin ? 'Country (optional)' : 'Country'}
                            required={!embedInAdmin}
                            value={gymBasics.country}
                            onChange={(country) => setGymBasics((prev) => ({ ...prev, country }))}
                            inputClassName={fieldClass}
                            labelClassName={labelClass}
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className={labelClass} htmlFor="wiz-latitude">
                              Latitude (optional)
                            </Label>
                            <Input
                              id="wiz-latitude"
                              type="number"
                              step="any"
                              className={fieldClass}
                              value={gymBasics.latitude}
                              onChange={(e) => setGymBasics((prev) => ({ ...prev, latitude: e.target.value }))}
                              placeholder="From map search"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClass} htmlFor="wiz-longitude">
                              Longitude (optional)
                            </Label>
                            <Input
                              id="wiz-longitude"
                              type="number"
                              step="any"
                              className={fieldClass}
                              value={gymBasics.longitude}
                              onChange={(e) => setGymBasics((prev) => ({ ...prev, longitude: e.target.value }))}
                              placeholder="From map search"
                            />
                          </div>
                        </div>
                        <div className="space-y-3 pt-2">
                          <div>
                            <Label className={labelClass}>{embedInAdmin ? 'Disciplines (optional)' : 'Disciplines *'}</Label>
                            <p className={wizHint}>Pick everything you regularly teach.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {DISCIPLINES.map((discipline) => {
                              const active = gymBasics.disciplines.includes(discipline)
                              return (
                                <button
                                  type="button"
                                  key={discipline}
                                  onClick={() =>
                                    setGymBasics((prev) => ({
                                      ...prev,
                                      disciplines: prev.disciplines.includes(discipline)
                                        ? prev.disciplines.filter((item) => item !== discipline)
                                        : [...prev.disciplines, discipline],
                                    }))
                                  }
                                  className={
                                    active
                                      ? 'flex items-center justify-center gap-2 rounded-xl border-2 border-[#003580] bg-[#003580]/[0.04] px-3 py-2.5 text-sm font-medium text-[#003580] transition-colors'
                                      : 'flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[#003580]/40 hover:text-gray-900'
                                  }
                                  aria-pressed={active}
                                >
                                  {discipline}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#003580] focus:ring-[#003580]/30 focus:ring-offset-0"
                              checked={offersAccommodation}
                              onChange={(e) => setOffersAccommodation(e.target.checked)}
                            />
                            <span>
                              <span className={`block ${wizLead}`}>We offer accommodation</span>
                              <span className={`mt-0.5 block ${wizMuted}`}>
                                Tick if guests can book a stay through you (on-site, nearby, or partner housing). Set
                                rooms and rates later in Packages &amp; Pricing.
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {basicSubSteps[basicSubStep - 1]?.key === 'trust' && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label className={labelClass} htmlFor="wiz-maps">Google Maps listing</Label>
                          <Input
                            id="wiz-maps"
                            className={fieldClass}
                            type="url"
                            inputMode="url"
                            autoComplete="url"
                            placeholder="https://maps.google.com/..."
                            value={gymBasics.google_maps_link}
                            onChange={(e) =>
                              setGymBasics((prev) => ({ ...prev, google_maps_link: e.target.value }))
                            }
                          />
                          <p className={wizHint}>Should match the address you entered on the previous page.</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className={labelClass} htmlFor="wiz-ig">Instagram</Label>
                            <Input
                              id="wiz-ig"
                              className={fieldClass}
                              type="url"
                              inputMode="url"
                              placeholder="https://instagram.com/yourgym"
                              value={gymBasics.instagram_link}
                              onChange={(e) =>
                                setGymBasics((prev) => ({ ...prev, instagram_link: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className={labelClass} htmlFor="wiz-fb">Facebook</Label>
                            <Input
                              id="wiz-fb"
                              className={fieldClass}
                              type="url"
                              inputMode="url"
                              placeholder="https://facebook.com/yourgym"
                              value={gymBasics.facebook_link}
                              onChange={(e) =>
                                setGymBasics((prev) => ({ ...prev, facebook_link: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <p className={wizMuted}>
                          Both are optional, but at least one social link helps travellers trust your gym faster. You
                          can add or update these later
                          {editorGymId ? (
                            <>
                              {' '}in{' '}
                              <Link
                                href={`/manage/gym/edit?id=${editorGymId}`}
                                className="font-medium text-[#003580] underline-offset-2 hover:underline"
                              >
                                gym settings
                              </Link>
                              .
                            </>
                          ) : (
                            <> in gym settings after your listing is created.</>
                          )}
                        </p>
                      </div>
                    )}

                    {basicSubSteps[basicSubStep - 1]?.key === 'holder' && (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="wiz-legal-first">Legal first name *</Label>
                            <Input
                              id="wiz-legal-first"
                              className={fieldClass}
                              autoComplete="given-name"
                              value={legalFirstName}
                              onChange={(e) => setLegalFirstName(e.target.value)}
                              placeholder="As on official ID"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wiz-legal-last">Legal last name *</Label>
                            <Input
                              id="wiz-legal-last"
                              className={fieldClass}
                              autoComplete="family-name"
                              value={legalLastName}
                              onChange={(e) => setLegalLastName(e.target.value)}
                              placeholder="As on official ID"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wiz-direct-phone">Direct mobile number *</Label>
                          <Input
                            id="wiz-direct-phone"
                            className={fieldClass}
                            type="tel"
                            autoComplete="tel"
                            value={accountHolderPhone}
                            onChange={(e) => setAccountHolderPhone(e.target.value)}
                            placeholder="Your mobile, not the gym reception"
                          />
                          <p className={wizHint}>Include country code where possible (e.g. +61 …).</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="wiz-role">Your role at the property *</Label>
                            <Select
                              id="wiz-role"
                              className={fieldClass}
                              value={roleAtProperty}
                              onChange={(e) => setRoleAtProperty(e.target.value as AccountHolderPropertyRole | '')}
                            >
                              <option value="">Select one</option>
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wiz-country">Country of residence *</Label>
                            <Select
                              id="wiz-country"
                              className={fieldClass}
                              value={countryOfResidence}
                              onChange={(e) => setCountryOfResidence(e.target.value)}
                            >
                              <option value="">Select country</option>
                              {RESIDENCE_COUNTRIES.map((c) => (
                                <option key={c.code} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3.5">
                          <p className="flex items-center gap-2 text-[13px] font-medium text-gray-900">
                            <ShieldCheck className="h-4 w-4 text-[#003580]" strokeWidth={2} />
                            Sign-in email
                          </p>
                          <p className={`mt-1.5 ${wizMuted}`}>
                            <span className="font-medium text-gray-900">{user?.email ?? '—'}</span>
                            {user?.email_confirmed_at ? (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> Verified
                              </span>
                            ) : (
                              <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                                Not verified
                              </span>
                            )}
                          </p>
                          {!user?.email_confirmed_at && user?.email ? (
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={btnGhost}
                                disabled={resendLoading}
                                onClick={() => void handleResendVerificationEmail()}
                              >
                                {resendLoading ? 'Sending…' : 'Resend verification email'}
                              </Button>
                              {resendMessage ? <p className={wizCaption}>{resendMessage}</p> : null}
                            </div>
                          ) : null}
                        </div>

                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {ACCOUNT_HOLDER_FINE_PRINT}
                        </p>
                        <p className={wizMuted}>
                          When you choose <strong className="font-semibold text-gray-900">Save and continue</strong>,
                          you&apos;ll confirm your password once. We then save your gym, record account holder details,
                          and mark this step complete.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {step.key === 'packages' && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <p className={wizLead}>What travellers see at checkout</p>
                      <p className={wizBody}>
                        Package names, descriptions, and prices on your public listing. Clear, honest wording here
                        builds trust and cuts support messages later.
                      </p>
                    </div>
                    {packagesPreview.length > 0 ? (
                      <div className="space-y-3">
                        {packageCount > packagesPreview.length ? (
                          <p className={wizCaption}>
                            Showing {packagesPreview.length} of {packageCount} packages.
                          </p>
                        ) : null}
                        {packagesPreview.map((pkg) => (
                          <div
                            key={pkg.id}
                            className="flex flex-col gap-3 rounded-xl border border-gray-200/90 bg-gray-50/60 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900">{pkg.name}</p>
                              <p className={`mt-1 ${wizMuted}`}>
                                {pkg.description?.trim() || '—'}
                              </p>
                            </div>
                            <p className="shrink-0 text-base font-semibold text-gray-900 sm:pt-0.5">
                              {formatPackagePrice(pkg)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : packageCount > 0 ? (
                      <p className={wizMuted}>
                        You have <span className="font-medium text-gray-900">{packageCount}</span> package
                        {packageCount === 1 ? '' : 's'}. Use <strong className="font-semibold text-gray-900">Add or edit packages</strong>{' '}
                        if the list does not appear here.
                      </p>
                    ) : (
                      <p className={wizMuted}>
                        No packages yet — use <strong className="font-semibold text-gray-900">Add or edit packages</strong>{' '}
                        to create at least one.
                      </p>
                    )}

                    {(packageCount > 0 || packagesPreview.length > 0) && (
                      <div className="flex gap-2.5 text-sm text-[#003580]">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        <p className={`${wizBody} text-[#003580]`}>
                          Pricing looks good — confirm to continue, or edit before going live.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className={`w-full sm:w-auto ${btnGhost}`}
                        onClick={() => void openPackageEditor()}
                      >
                        Add or edit packages
                      </Button>
                      <Button
                        variant="outline"
                        className={`w-full sm:w-auto ${btnGhost}`}
                        onClick={() => void checkStepCompletionFromData()}
                      >
                        Re-check status
                      </Button>
                    </div>
                  </div>
                )}

                {step.key === 'photos' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className={wizLead}>Photos on your public listing</p>
                      <p className={wizBody}>
                        These are the images guests see when they view your gym. Upload at least three, and use the{' '}
                        <span className="font-medium text-gray-900">highest resolution you have</span>
                        {' '}—{' '}
                        clear, well-lit shots from a recent phone or camera are enough. Good lighting and a steady frame
                        make the biggest difference.
                      </p>
                      <p className={wizBody}>
                        <span className="font-medium text-gray-900">{photoCount}</span> uploaded · need at least{' '}
                        <span className="font-medium text-gray-900">3</span> for go-live readiness.
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className={fieldClass}
                      onChange={(event) => {
                        const files = event.target.files ? Array.from(event.target.files) : []
                        setPhotoFiles(files)
                      }}
                    />
                    {photoFiles.length > 0 && (
                      <p className={wizCaption}>{photoFiles.length} files ready to upload</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button className={btnGhost} variant="outline" onClick={() => void uploadPhotosForActiveGym()}>
                        Upload photos
                      </Button>
                      <Button className={btnGhost} variant="outline" onClick={() => void checkStepCompletionFromData()}>
                        Re-check photo status
                      </Button>
                    </div>
                  </div>
                )}

                {step.key === 'policy' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <p className={wizLead}>Set the tone for cancellations</p>
                      <p className={wizBody}>
                        This preference signals how you usually handle changes. Package-level rules still apply where
                        you&apos;ve set them — it defaults to flexible until you change it.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label className={`${labelClass} mb-0`} htmlFor="wiz-policy-preference">
                          Policy preference
                        </Label>
                        <div className="group relative inline-flex shrink-0">
                          <button
                            type="button"
                            className="inline-flex rounded-full p-0.5 text-muted-foreground transition-colors hover:text-[#003580] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/30 focus-visible:ring-offset-1"
                            aria-label="Policy preference help"
                            aria-describedby="wiz-policy-tooltip"
                          >
                            <Info className="h-3 w-3" aria-hidden />
                          </button>
                          <div
                            id="wiz-policy-tooltip"
                            role="tooltip"
                            className="pointer-events-none absolute bottom-full left-1/2 z-[200] mb-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-xs leading-relaxed text-gray-700 shadow-lg opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                          >
                            {POLICY_PREFERENCE_TOOLTIPS[policyPreference] ?? POLICY_PREFERENCE_TOOLTIPS.flexible}
                          </div>
                        </div>
                      </div>
                      <Select
                        id="wiz-policy-preference"
                        className={fieldClass}
                        value={policyPreference}
                        onChange={(event) => setPolicyPreference(event.target.value)}
                        aria-describedby="wiz-policy-tooltip"
                      >
                        <option value="flexible">Flexible</option>
                        <option value="moderate">Moderate</option>
                        <option value="strict">Strict</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Optional note</Label>
                      <Textarea
                        className={fieldClass}
                        rows={3}
                        value={policyNote}
                        onChange={(event) => setPolicyNote(event.target.value)}
                      />
                    </div>
                    <Button className={btnPrimary} onClick={() => void savePolicyPreference()}>
                      Save policy
                    </Button>
                  </div>
                )}

                {step.key === 'payouts' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <p className={wizLead}>Payouts before you go live</p>
                      <p className={wizBody}>
                        Choose <strong className="font-semibold text-gray-900">Wise</strong> (default) or{' '}
                        <strong className="font-semibold text-gray-900">Stripe Connect</strong>, then complete the
                        details. Readiness follows the method you select.
                      </p>
                    </div>
                    <p className={wizBody}>
                      Method:{' '}
                      <span className="font-semibold text-gray-900">
                        {payoutRail === 'stripe_connect' ? 'Stripe Connect' : 'Wise'}
                      </span>
                      {' · '}
                      <span className="font-semibold text-gray-900">
                        {payoutStepComplete ? 'Ready' : 'Not ready'}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={
                          editorGymId
                            ? `/manage/payouts/setup?gym_id=${encodeURIComponent(editorGymId)}`
                            : buildWizardStepDeepLink(step, editorGymId, wizardUrlOptions)
                        }
                      >
                        <Button className={btnGhost} variant="outline">
                          Open payout setup
                        </Button>
                      </Link>
                      <Button className={btnGhost} variant="outline" onClick={() => void refreshPayoutStatus()}>
                        Refresh status
                      </Button>
                    </div>
                  </div>
                )}

                {step.key === 'security' && (
                  embedInAdmin ? (
                    <div className="space-y-3">
                      <p className={wizBody}>
                        Not required for staff-created listings. This step is marked complete when you save Basic Info
                        so you can focus on packages, photos, and handoff.
                      </p>
                    </div>
                  ) : (
                  <div className="space-y-8">
                    {!securityDone ? (
                      <div className="flex flex-col gap-3 rounded-lg border border-amber-200/90 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className={`${wizMuted} text-amber-950`}>
                          Complete <strong className="font-semibold text-amber-950">Basic Info</strong> first (account
                          holder + verified email), then use Refresh status here.
                        </p>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link href={buildWizUrl('step-1', editorGymId)}>
                            <Button size="sm" className={btnGhost} variant="outline">
                              Go to Basic Info
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className={btnGhost}
                            variant="outline"
                            onClick={() => void checkStepCompletionFromData()}
                          >
                            Refresh status
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className={wizMuted}>
                        Account holder and verified email are on file from Basic Info. Below you can update your
                        password and optionally turn on an authenticator app.
                      </p>
                    )}

                    <div className="space-y-4 border-t border-gray-100 pt-8">
                      <p className={wizSubsection}>Update password (if needed)</p>
                      <p className={wizMuted}>Change your password if you want it to match the standards below.</p>
                      <Input
                        className={fieldClass}
                        type="password"
                        autoComplete="current-password"
                        placeholder="Current password"
                        value={wizCurrentPassword}
                        onChange={(e) => setWizCurrentPassword(e.target.value)}
                      />
                      <Input
                        className={fieldClass}
                        type="password"
                        autoComplete="new-password"
                        placeholder="New password"
                        value={wizNewPassword}
                        onChange={(e) => setWizNewPassword(e.target.value)}
                      />
                      <Input
                        className={fieldClass}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        value={wizConfirmPassword}
                        onChange={(e) => setWizConfirmPassword(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        className={`w-full sm:w-auto ${btnGhost}`}
                        onClick={() => void handleWizardPasswordUpdate()}
                        disabled={
                          wizPasswordUpdating || !wizCurrentPassword || !wizNewPassword || !wizConfirmPassword
                        }
                      >
                        {wizPasswordUpdating ? 'Updating…' : 'Update password'}
                      </Button>
                      {wizPasswordMessage ? (
                        <p className="text-sm text-green-700" role="status">
                          {wizPasswordMessage}
                        </p>
                      ) : null}
                      <div className="space-y-2 border-t border-gray-100 pt-6">
                        <p className="text-sm font-medium text-gray-800">Password standards</p>
                        <ul className={`list-inside list-disc space-y-1 ${wizCaption}`}>
                          {PASSWORD_RULES.map((rule) => (
                            <li key={rule}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <MfaTotpInlineSection
                      subsectionClassName={wizSubsection}
                      mutedClassName={wizMuted}
                      outlineButtonClassName={`w-full sm:w-auto ${btnGhost}`}
                    />
                  </div>
                  )
                )}

                {step.key === 'finalize' && (
                  embedInAdmin ? (
                    <div className="space-y-5">
                      <p className={wizBody}>
                        The listing stays in <strong className="text-gray-900">draft</strong> until you verify it or the
                        future owner completes onboarding. Use the actions below when you&apos;re ready.
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Link href={editorGymId ? `/manage/gym/edit?id=${encodeURIComponent(editorGymId)}` : '#'}>
                          <Button
                            className={btnPrimary}
                            disabled={!editorGymId}
                            type="button"
                          >
                            Open full gym editor
                          </Button>
                        </Link>
                        <Link href="/admin/gyms">
                          <Button variant="outline" className={btnGhost} type="button">
                            Back to all gyms
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          className={`${btnGhost} border-emerald-200 text-emerald-900 hover:bg-emerald-50`}
                          disabled={!editorGymId || adminVerifyBusy}
                          onClick={() => void runAdminVerifyGym()}
                        >
                          {adminVerifyBusy ? 'Verifying…' : 'Verify gym now'}
                        </Button>
                      </div>
                      {adminVerifyMessage ? (
                        <p className="text-sm text-emerald-800" role="status">
                          {adminVerifyMessage}
                        </p>
                      ) : null}
                      <p className={`${wizCaption} text-muted-foreground`}>
                        Verify marks the gym approved for the platform (admin override). You can still edit everything in
                        the full editor afterwards.
                      </p>
                    </div>
                  ) : (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-[#003580]/10 bg-[#003580]/[0.03] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#003580]">
                        Go-live review
                      </p>
                      <p className={`mt-2 ${wizBody}`}>
                        This is the final checkpoint before publishing. We keep the detailed readiness review here, so the
                        earlier steps stay focused on one job at a time.
                      </p>
                      <p className="mt-3 text-sm font-semibold text-gray-900">
                        {coreStepsCompleteCount}/5 core areas ready
                      </p>
                    </div>

                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200/80 bg-white">
                      {finalReadinessItems.map((item) => (
                        <div key={item.key} className="flex items-start justify-between gap-4 px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.detail}</p>
                          </div>
                          <span
                            className={
                              item.ready
                                ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200'
                                : 'rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200'
                            }
                          >
                            {item.ready ? 'Ready' : 'Needs work'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className={wizMuted}>
                      When you&apos;re ready, use <strong className="font-semibold text-gray-900">Finish below</strong>.
                      We&apos;ll open the full readiness review, then you can publish or return to your dashboard.
                    </p>
                  </div>
                  )
                )}

                {!hasDedicatedStepContent && (
                  <div className="space-y-3">
                    <p className={wizMuted}>
                      Open the related editor to complete this step.
                    </p>
                    <Link href={buildWizardStepDeepLink(step, editorGymId, wizardUrlOptions)}>
                      <Button className={btnGhost} variant="outline">
                        Open editor
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky footer action bar — consistent with security onboarding */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-2 sm:gap-3">
            {!embedInAdmin ? (
              <p className="hidden text-[12px] font-medium tabular-nums text-gray-500 sm:block">
                {isMigratedStep && totalBasicSubSteps > 1 ? (
                  <>
                    {step.label} · {basicSubStep}/{totalBasicSubSteps}
                  </>
                ) : (
                  <>
                    Step {step.index} of {wizardSteps.length} · {progressPct}%
                  </>
                )}
              </p>
            ) : null}
            {isMigratedStep && basicSubStep > 1 ? (
              <Button
                variant="outline"
                onClick={handleBasicBack}
                className="h-10 rounded-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                Back
              </Button>
            ) : previousStep ? (
              <Link href={buildWizUrl(previousStep.slug, editorGymId)}>
                <Button variant="outline" className="h-10 rounded-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                  Back
                </Button>
              </Link>
            ) : (
              <span />
            )}

            {!embedInAdmin ? (
              <Link
                href={`/manage/onboarding/review${editorGymId ? `?gym_id=${encodeURIComponent(editorGymId)}` : ''}`}
              >
                <Button
                  variant="ghost"
                  className="h-10 rounded-full text-gray-500 hover:bg-gray-50 hover:text-[#003580]"
                >
                  Review
                </Button>
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {stepIsComplete && !isMigratedStep && !(embedInAdmin && step.key === 'finalize') ? (
              <Button
                onClick={() => void saveStepCompletion(false)}
                disabled={saving || loading}
                variant="outline"
                className="h-10 rounded-full border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
              >
                {saving ? 'Saving…' : 'Mark incomplete'}
              </Button>
            ) : null}

            {isMigratedStep ? (
              <Button
                className="h-10 items-center gap-2 rounded-full bg-[#003580] px-5 text-[13.5px] font-medium text-white hover:bg-[#002a66] disabled:opacity-50"
                onClick={() => handleBasicContinue()}
                disabled={
                  saving ||
                  loading ||
                  (basicSubStep === totalBasicSubSteps && !embedInAdmin && selfServeExpired) ||
                  (basicSubStep === totalBasicSubSteps &&
                    !embedInAdmin &&
                    (!verificationSummary.emailVerified || !accountHolderComplete))
                }
              >
                {saving
                  ? 'Saving…'
                  : basicSubStep < totalBasicSubSteps
                    ? 'Continue'
                    : 'Save & continue'}
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </Button>
            ) : !(embedInAdmin && step.key === 'finalize') ? (
              <Button
                className="h-10 items-center gap-2 rounded-full bg-[#003580] px-5 text-[13.5px] font-medium text-white hover:bg-[#002a66] disabled:opacity-50"
                onClick={() => void saveStepCompletion(true)}
                disabled={saving || loading}
              >
                {saving
                  ? 'Saving…'
                  : step.key === 'finalize'
                    ? 'Finish'
                    : step.key === 'packages'
                      ? 'Confirm & continue'
                      : 'Continue'}
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {packagesPanelOpen && editorGymId ? (
        <OnboardingPackagesPanel
          open={packagesPanelOpen}
          gymId={editorGymId}
          currency={gymCurrency}
          onClose={() => {
            setPackagesPanelOpen(false)
            void refreshPackagesFromServer()
          }}
          onPackagesChanged={() => {
            void refreshPackagesFromServer()
          }}
        />
      ) : null}

      <ReAuthDialog
        open={showReAuth}
        onOpenChange={setShowReAuth}
        title="Confirm your password"
        description="We save your gym listing and account holder details after we confirm it's you."
        onSuccess={() => {
          void finalizeBasicInfoAfterReauth()
        }}
      />
    </div>
  )
}
