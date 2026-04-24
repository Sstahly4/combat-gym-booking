'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Navigation,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  X,
  Dumbbell,
  BedDouble,
  GraduationCap,
  Building2,
  Palmtree,
  Waves,
  Umbrella,
  Trees,
  type LucideIcon,
} from 'lucide-react'
import { useBooking } from '@/lib/contexts/booking-context'
import {
  format,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfWeek,
  endOfWeek,
} from 'date-fns'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_SUBTITLES: Record<string, string> = {
  gyms: 'Search gyms',
  'train-stay': 'Search with accomodation',
  seminars: 'Search seminars',
}

/** Airbnb-style pastel tile + line icon for curated / location rows (not gyms). */
type WhereLocationVisual =
  | 'nearby'
  | 'island'
  | 'metro'
  | 'coast'
  | 'beachTown'
  | 'mountain'

const WHERE_LOCATION_STYLES: Record<
  WhereLocationVisual,
  { Icon: LucideIcon; bg: string; iconClass: string }
> = {
  nearby: { Icon: Navigation, bg: 'bg-sky-100', iconClass: 'text-sky-600' },
  island: { Icon: Palmtree, bg: 'bg-cyan-100', iconClass: 'text-cyan-700' },
  metro: { Icon: Building2, bg: 'bg-amber-100', iconClass: 'text-amber-800' },
  coast: { Icon: Waves, bg: 'bg-teal-100', iconClass: 'text-teal-700' },
  beachTown: { Icon: Umbrella, bg: 'bg-rose-100', iconClass: 'text-rose-600' },
  mountain: { Icon: Trees, bg: 'bg-emerald-100', iconClass: 'text-emerald-800' },
}

/** Fallback palettes for recent searches that are not known places (stable hash → color). */
const WHERE_RECENT_FALLBACK: Array<{ Icon: LucideIcon; bg: string; iconClass: string }> = [
  { Icon: MapPin, bg: 'bg-slate-100', iconClass: 'text-slate-600' },
  { Icon: Waves, bg: 'bg-blue-100', iconClass: 'text-blue-600' },
  { Icon: Building2, bg: 'bg-violet-100', iconClass: 'text-violet-700' },
  { Icon: Palmtree, bg: 'bg-orange-100', iconClass: 'text-orange-700' },
  { Icon: Trees, bg: 'bg-lime-100', iconClass: 'text-lime-800' },
]

const SUGGESTED_DESTINATIONS = [
  {
    name: 'Nearby',
    subtitle: "Find what's around you",
    type: 'nearby' as const,
    visual: 'nearby' as const,
  },
  {
    name: 'Phuket',
    subtitle: 'Popular beach & island destination',
    type: 'place' as const,
    visual: 'island' as const,
  },
  {
    name: 'Bangkok',
    subtitle: 'Great for city stays and night markets',
    type: 'place' as const,
    visual: 'metro' as const,
  },
  {
    name: 'Krabi',
    subtitle: 'Quiet beaches and dramatic limestone coast',
    type: 'place' as const,
    visual: 'coast' as const,
  },
  {
    name: 'Pattaya',
    subtitle: 'Lively beach city with long resort strips',
    type: 'place' as const,
    visual: 'beachTown' as const,
  },
  {
    name: 'Chiang Mai',
    subtitle: 'Cooler mountain city with a slower pace',
    type: 'place' as const,
    visual: 'mountain' as const,
  },
] as const

/** Subtitle under any Where row (recents or free text) — matches suggested copy when we recognize a place. */
function whereRowSubtitleForLabel(raw: string): string {
  const q = raw.trim().toLowerCase()
  if (!q) return ''
  const nearbyPhrases = ['near me', 'nearby', 'close to me', 'around me']
  if (nearbyPhrases.some((w) => q.includes(w))) {
    return "Find what's around you"
  }

  const places = [...SUGGESTED_DESTINATIONS.filter((d) => d.type === 'place')].sort(
    (a, b) => b.name.length - a.name.length,
  )
  for (const d of places) {
    const name = d.name.toLowerCase()
    if (
      q === name ||
      q.startsWith(`${name} `) ||
      q.startsWith(`${name},`) ||
      q.includes(`, ${name}`) ||
      q.includes(` ${name}`) ||
      q.includes(name)
    ) {
      return d.subtitle
    }
  }

  if (/\bthailand\b/.test(q)) return 'Training camps and long-stay stays'

  return 'From your recent searches'
}

function hashWhereRecentLabel(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function styleForWhereLocationLabel(query: string): { Icon: LucideIcon; bg: string; iconClass: string } {
  const q = query.trim().toLowerCase()
  if (!q) return WHERE_LOCATION_STYLES.nearby
  const nearbyHint = ['near me', 'nearby', 'close to me', 'around me'].some((w) => q.includes(w))
  if (nearbyHint) return WHERE_LOCATION_STYLES.nearby

  const places = [...SUGGESTED_DESTINATIONS.filter((d) => d.type === 'place')].sort(
    (a, b) => b.name.length - a.name.length,
  )
  for (const d of places) {
    const name = d.name.toLowerCase()
    if (
      q === name ||
      q.startsWith(`${name} `) ||
      q.startsWith(`${name},`) ||
      q.includes(`, ${name}`) ||
      q.includes(` ${name}`) ||
      q.includes(name)
    ) {
      return WHERE_LOCATION_STYLES[d.visual]
    }
  }
  const idx = hashWhereRecentLabel(q) % WHERE_RECENT_FALLBACK.length
  return WHERE_RECENT_FALLBACK[idx]!
}

function WhereLocationIconTile({
  visual,
  size,
}: {
  visual: WhereLocationVisual
  size: 'sm' | 'md'
}) {
  const { Icon, bg, iconClass } = WHERE_LOCATION_STYLES[visual]
  const box = size === 'sm' ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-xl'
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <div className={`flex flex-shrink-0 items-center justify-center ${box} ${bg}`}>
      <Icon className={`${icon} ${iconClass}`} strokeWidth={1.85} aria-hidden />
    </div>
  )
}

function WhereRecentSearchIconTile({ label, size }: { label: string; size: 'sm' | 'md' }) {
  const { Icon, bg, iconClass } = styleForWhereLocationLabel(label)
  const box = size === 'sm' ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-xl'
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <div className={`flex flex-shrink-0 items-center justify-center ${box} ${bg}`}>
      <Icon className={`${icon} ${iconClass}`} strokeWidth={1.85} aria-hidden />
    </div>
  )
}

const CATEGORIES = [
  { id: 'gyms', label: 'Gyms', emoji: '🥊', Icon: Dumbbell, isNew: false },
  { id: 'train-stay', label: 'Train & Stay', emoji: '🏨', Icon: BedDouble, isNew: false },
  { id: 'seminars', label: 'Seminars', emoji: '🎓', isNew: true, Icon: GraduationCap },
] as const

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const TIMELINE_OPTIONS = [
  { id: 'exact', label: 'Exact dates' },
  { id: '1day', label: '1 day', days: 1 },
  { id: '7days', label: '7 days', days: 7 },
  { id: '14days', label: '14 days', days: 14 },
  { id: '1month', label: '1 month', months: 1 },
  { id: '6months', label: '6 months', months: 6 },
] as const

type ActiveSlot = 'where' | 'when' | 'who' | null
type MobilePanel = 'where' | 'when' | 'who'

type GymSuggestRow = { id: string; name: string; city: string; country: string }

// ─── Guest Counter sub-component ─────────────────────────────────────────────

function GuestCounter({
  label,
  subtitle,
  value,
  onChange,
  min = 0,
}: {
  label: string
  subtitle: string
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-gray-100 last:border-0">
      <div>
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-medium text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SearchBarRedesign({
  showTabs = true,
  yellowBorder = false,
  activeCategory: controlledCategory,
  accommodationOnly = false,
  initialQuery = '',
  onCategoryChange,
}: {
  showTabs?: boolean
  yellowBorder?: boolean
  activeCategory?: 'gyms' | 'train-stay' | 'seminars'
  accommodationOnly?: boolean
  initialQuery?: string
  /** Sync category with parent (e.g. homepage / search page tabs) when changed from the mobile modal */
  onCategoryChange?: (category: 'gyms' | 'train-stay' | 'seminars') => void
}) {
  const router = useRouter()
  const { checkin, setCheckin, checkout, setCheckout } = useBooking()

  const [activeCategory, setActiveCategory] = useState<'gyms' | 'train-stay' | 'seminars'>('gyms')
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>(null)
  const [hoveredSlot, setHoveredSlot] = useState<ActiveSlot>(null)
  const [selectedTimeline, setSelectedTimeline] = useState<(typeof TIMELINE_OPTIONS)[number]['id']>('exact')
  const [whereQuery, setWhereQuery] = useState(initialQuery)
  const [userHasSelectedDates, setUserHasSelectedDates] = useState(false)

  // Mobile modal state
  const [mobileModalOpen, setMobileModalOpen] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('where')
  const [mounted, setMounted] = useState(false)
  /** Full-screen “Where” sheet (Airbnb-style): hides category tabs + footer; back or swipe-down on header exits. */
  const [mobileWhereImmersive, setMobileWhereImmersive] = useState(false)
  const [immersiveSheetTranslateY, setImmersiveSheetTranslateY] = useState(0)
  const [immersiveSheetDragging, setImmersiveSheetDragging] = useState(false)
  const [immersiveSheetClosing, setImmersiveSheetClosing] = useState(false)
  const [mobileModalViewportH, setMobileModalViewportH] = useState<number | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [gymSuggestions, setGymSuggestions] = useState<GymSuggestRow[]>([])
  const [gymSuggestLoading, setGymSuggestLoading] = useState(false)
  /** True when every hit was pg_trgm fuzzy (no substring match on name or aliases). */
  const [gymDidYouMean, setGymDidYouMean] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Load recent searches from localStorage once mounted
  useEffect(() => {
    if (!mounted) return
    try {
      const stored = localStorage.getItem('cb_recentSearches')
      if (stored) setRecentSearches(JSON.parse(stored))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (controlledCategory) setActiveCategory(controlledCategory)
  }, [controlledCategory])

  // iOS Safari tab/app switching can leave fixed overlays shorter until the next scroll.
  // While the mobile modal is open, drive its height from innerHeight / visualViewport.
  useEffect(() => {
    if (!mobileModalOpen) {
      setMobileModalViewportH(null)
      return
    }

    const readH = () => {
      const vv = window.visualViewport
      const h = Math.round(vv?.height ?? window.innerHeight)
      // Avoid tiny values during transient resize states.
      if (h > 200) setMobileModalViewportH(h)
    }

    readH()

    const vv = window.visualViewport
    vv?.addEventListener('resize', readH)
    vv?.addEventListener('scroll', readH)
    window.addEventListener('resize', readH)
    window.addEventListener('orientationchange', readH)
    document.addEventListener('visibilitychange', readH)

    return () => {
      vv?.removeEventListener('resize', readH)
      vv?.removeEventListener('scroll', readH)
      window.removeEventListener('resize', readH)
      window.removeEventListener('orientationchange', readH)
      document.removeEventListener('visibilitychange', readH)
    }
  }, [mobileModalOpen])

  // Guest state
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [pets, setPets] = useState(0)

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const whereInputRef = useRef<HTMLInputElement>(null)
  const mobileWhereInputRef = useRef<HTMLInputElement>(null)
  const immersiveHeaderTouchY = useRef(0)
  const immersiveScrollTouch = useRef({ y: 0, scrollTop: 0 })
  const immersiveSheetRef = useRef<HTMLDivElement>(null)
  const immersiveScrollRef = useRef<HTMLDivElement>(null)
  const immersiveWhereSearchBarRef = useRef<HTMLDivElement>(null)
  const compactWhereSearchBarRef = useRef<HTMLDivElement>(null)
  const immersiveDrag = useRef({
    startY: 0,
    startT: 0,
    started: false,
    lastDy: 0,
  })

  const [immersiveCloseAnimating, setImmersiveCloseAnimating] = useState(false)

  // Lock scroll when mobile modal is open (html + body: iOS Safari often still
  // rubber-bands / shows content behind a fixed overlay until a repaint).
  useEffect(() => {
    if (!mobileModalOpen) {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      return
    }
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [mobileModalOpen])

  // Auto-focus mobile where input when panel opens or immersive Where opens
  useEffect(() => {
    if (mobileModalOpen && mobilePanel === 'where') {
      setTimeout(() => mobileWhereInputRef.current?.focus(), mobileWhereImmersive ? 120 : 60)
    }
  }, [mobileModalOpen, mobilePanel, mobileWhereImmersive])

  useEffect(() => {
    if (!mobileModalOpen) setMobileWhereImmersive(false)
  }, [mobileModalOpen])

  useEffect(() => {
    if (mobilePanel !== 'where') setMobileWhereImmersive(false)
  }, [mobilePanel])

  // Immersive Where: Airbnb-style drag-to-dismiss (sheet translate) with non-passive touchmove to prevent iOS rubber-band.
  useEffect(() => {
    if (!mobileModalOpen || !mobileWhereImmersive || mobilePanel !== 'where') return
    const sheetEl = immersiveSheetRef.current
    if (!sheetEl) return

    // Reset any stale state on open.
    setImmersiveSheetTranslateY(0)
    setImmersiveSheetDragging(false)
    setImmersiveSheetClosing(false)

    const getScrollTop = () => immersiveScrollRef.current?.scrollTop ?? 0

    const onTouchStart = (e: TouchEvent) => {
      if (immersiveSheetClosing) return
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      if (!t) return
      immersiveDrag.current = {
        startY: t.clientY,
        startT: performance.now(),
        started: false,
        lastDy: 0,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (immersiveSheetClosing) return
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      if (!t) return
      const dy = t.clientY - immersiveDrag.current.startY
      const atTop = getScrollTop() <= 0

      // Only start dragging downward if the scroll region is fully at top.
      if (!immersiveDrag.current.started) {
        if (!atTop || dy <= 0) return
        immersiveDrag.current.started = true
        setImmersiveSheetDragging(true)
      }

      // From this point, we own the gesture: prevent scroll rubber-band and translate the sheet.
      e.preventDefault()

      // Stronger resistance so it feels less “snappy”.
      const resisted = Math.min(dy, 360)
      const eased = resisted * 0.75
      immersiveDrag.current.lastDy = eased
      setImmersiveSheetTranslateY(eased)
    }

    const settle = (dismiss: boolean) => {
      setImmersiveSheetDragging(false)
      if (!dismiss) {
        setImmersiveSheetTranslateY(0)
        return
      }
      setImmersiveSheetClosing(true)
      // Slide down out of view, then close immersive.
      const out = Math.max(window.innerHeight * 0.85, 520)
      setImmersiveSheetTranslateY(out)
      window.setTimeout(() => {
        closeImmersiveWhere()
        setImmersiveSheetTranslateY(0)
        setImmersiveSheetClosing(false)
      }, 320)
    }

    const onTouchEnd = () => {
      if (!immersiveDrag.current.started) return
      const dy = immersiveDrag.current.lastDy
      const dt = Math.max(1, performance.now() - immersiveDrag.current.startT)
      const v = dy / dt // px/ms
      settle(dy > 160 || v > 1.2)
    }

    const onTouchCancel = () => {
      if (!immersiveDrag.current.started) return
      settle(false)
    }

    sheetEl.addEventListener('touchstart', onTouchStart, { passive: true })
    sheetEl.addEventListener('touchmove', onTouchMove, { passive: false })
    sheetEl.addEventListener('touchend', onTouchEnd, { passive: true })
    sheetEl.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      sheetEl.removeEventListener('touchstart', onTouchStart)
      sheetEl.removeEventListener('touchmove', onTouchMove)
      sheetEl.removeEventListener('touchend', onTouchEnd)
      sheetEl.removeEventListener('touchcancel', onTouchCancel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileModalOpen, mobileWhereImmersive, mobilePanel, immersiveSheetClosing])

  const closeImmersiveWhere = useCallback(() => {
    if (!mobileWhereImmersive || mobilePanel !== 'where') return
    if (immersiveCloseAnimating) return

    const src = immersiveWhereSearchBarRef.current
    if (!src) {
      setMobileWhereImmersive(false)
      return
    }

    const srcRect = src.getBoundingClientRect()
    if (!srcRect.width) {
      setMobileWhereImmersive(false)
      return
    }

    setImmersiveCloseAnimating(true)

    const clone = src.cloneNode(true) as HTMLElement
    clone.style.position = 'fixed'
    clone.style.left = `${srcRect.left}px`
    clone.style.top = `${srcRect.top}px`
    clone.style.width = `${srcRect.width}px`
    clone.style.height = `${srcRect.height}px`
    clone.style.margin = '0'
    clone.style.zIndex = '9999'
    clone.style.pointerEvents = 'none'
    clone.style.transformOrigin = 'top left'
    clone.style.willChange = 'transform, opacity'
    clone.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out'

    const prevSrcOpacity = src.style.opacity
    src.style.opacity = '0'

    document.body.appendChild(clone)

    // Switch to the compact view, then animate the clone into the compact search bar position.
    setMobileWhereImmersive(false)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const dst = compactWhereSearchBarRef.current
        const dstRect = dst?.getBoundingClientRect()
        if (!dst || !dstRect?.width) {
          clone.remove()
          src.style.opacity = prevSrcOpacity
          setImmersiveCloseAnimating(false)
          return
        }

        const prevDstOpacity = dst.style.opacity
        dst.style.opacity = '0'

        const dx = dstRect.left - srcRect.left
        const dy = dstRect.top - srcRect.top
        const sx = dstRect.width / srcRect.width
        const sy = dstRect.height / srcRect.height

        clone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`

        window.setTimeout(() => {
          clone.remove()
          src.style.opacity = prevSrcOpacity
          dst.style.opacity = prevDstOpacity
          setImmersiveCloseAnimating(false)
        }, 340)
      })
    })
  }, [immersiveCloseAnimating, mobilePanel, mobileWhereImmersive])

  function renderMobileNonImmersive(opts?: { hidden?: boolean }) {
    const wrap = opts?.hidden ? 'pointer-events-none opacity-0' : ''
    return (
      <div className={wrap} aria-hidden={opts?.hidden ? true : undefined}>
        {/* Header: safe-area top padding, category tabs, close control */}
        <div className="relative flex-shrink-0 px-4 pt-[max(1.75rem,calc(env(safe-area-inset-top)+1.125rem))] pb-4">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => {
              setMobileWhereImmersive(false)
              setMobileModalOpen(false)
            }}
            className="absolute right-4 top-[max(1.75rem,calc(env(safe-area-inset-top)+1.125rem))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-gray-200/90 shadow-[0_2px_6px_rgba(15,23,42,0.1),0_6px_20px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.06)]"
          >
            <X className="w-5 h-5 text-gray-800" strokeWidth={2} />
          </button>
          <nav className="flex justify-center gap-5 sm:gap-9 px-12" aria-label="Search category">
            {CATEGORIES.map((cat) => {
              const CatIcon = cat.Icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const id = cat.id as 'gyms' | 'train-stay' | 'seminars'
                    setActiveCategory(id)
                    onCategoryChange?.(id)
                  }}
                  className="relative flex min-w-0 flex-col items-center gap-1.5 pb-2.5 pt-1"
                >
                  {cat.isNew && (
                    <span className="absolute -top-0.5 right-0 translate-x-1/2 bg-[#003580] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      NEW
                    </span>
                  )}
                  <CatIcon
                    className={`w-8 h-8 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
                    strokeWidth={1.85}
                  />
                  <span
                    className={`text-sm font-medium tracking-tight whitespace-nowrap ${
                      isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {cat.label}
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 h-[3px] w-10 max-w-full -translate-x-1/2 rounded-full transition-opacity ${
                      isActive ? 'bg-gray-900 opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              )
            })}
          </nav>
        </div>

        {/* ── Scrollable cards ── */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain px-4 pb-4">
          {/* ══ WHERE card ══ */}
          {mobilePanel === 'where' ? (
            <div className="relative flex flex-col overflow-hidden rounded-3xl border border-gray-100/90 bg-white px-4 pt-4 pb-0 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.07),0_20px_48px_-12px_rgba(15,23,42,0.06)]">
              <h2 className="mb-3 flex-shrink-0 text-2xl font-bold text-gray-900">Where?</h2>
              <div
                ref={compactWhereSearchBarRef}
                className="mb-3 flex flex-shrink-0 items-center gap-3 rounded-xl border border-gray-200/90 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
              >
                <Search className="h-4 w-4 flex-shrink-0 text-gray-500" strokeWidth={2.25} />
                <input
                  ref={mobileWhereInputRef}
                  type="text"
                  value={whereQuery}
                  onChange={(e) => setWhereQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setMobilePanel('when')
                  }}
                  placeholder="Search destinations"
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                />
                {whereQuery && (
                  <button type="button" onClick={() => setWhereQuery('')} className="p-1">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <div className="flex-shrink-0">{renderGymSuggestBlock('mobile')}</div>
              {/* NOTE: remaining Where card content unchanged below in existing JSX */}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  const mobileFilteredSuggested = useMemo(
    () =>
      SUGGESTED_DESTINATIONS.filter(
        (d) =>
          !whereQuery ||
          d.name.toLowerCase().includes(whereQuery.toLowerCase()) ||
          d.subtitle.toLowerCase().includes(whereQuery.toLowerCase()),
      ),
    [whereQuery],
  )

  // Close desktop dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveSlot(null)
      }
    }
    if (activeSlot) {
      document.addEventListener('mousedown', handleOutside)
      return () => document.removeEventListener('mousedown', handleOutside)
    }
  }, [activeSlot])

  // Focus desktop Where input when slot opens
  useEffect(() => {
    if (activeSlot === 'where') {
      setTimeout(() => whereInputRef.current?.focus(), 60)
    }
  }, [activeSlot])

  // Debounced gym name autocomplete (catalog search only — same idea as Netflix matching *their* titles).
  useEffect(() => {
    if (activeCategory === 'seminars') {
      setGymSuggestions([])
      setGymSuggestLoading(false)
      setGymDidYouMean(false)
      return
    }
    const q = whereQuery.trim()
    if (q.length < 2) {
      setGymSuggestions([])
      setGymSuggestLoading(false)
      setGymDidYouMean(false)
      return
    }

    const ac = new AbortController()
    const t = window.setTimeout(async () => {
      setGymSuggestLoading(true)
      setGymDidYouMean(false)
      try {
        const res = await fetch(`/api/gyms/suggest?q=${encodeURIComponent(q)}`, { signal: ac.signal })
        const json = (await res.json()) as { gyms?: GymSuggestRow[]; did_you_mean?: boolean }
        if (!ac.signal.aborted) {
          setGymSuggestions(Array.isArray(json.gyms) ? json.gyms : [])
          setGymDidYouMean(Boolean(json.did_you_mean))
        }
      } catch {
        if (!ac.signal.aborted) {
          setGymSuggestions([])
          setGymDidYouMean(false)
        }
      } finally {
        if (!ac.signal.aborted) setGymSuggestLoading(false)
      }
    }, 280)

    return () => {
      window.clearTimeout(t)
      ac.abort()
    }
  }, [whereQuery, activeCategory])

  const openGymProfile = useCallback(
    (gymId: string) => {
      router.push(`/gyms/${gymId}`)
      setActiveSlot(null)
      setMobileModalOpen(false)
    },
    [router],
  )

  const showGymSuggest = activeCategory !== 'seminars'

  // ── Derived values ────────────────────────────────────────────────────────
  const checkinDate = checkin ? new Date(checkin + 'T00:00:00') : null
  const checkoutDate = checkout ? new Date(checkout + 'T00:00:00') : null

  const whenDisplay = () => {
    if (checkinDate && checkoutDate) {
      return `${format(checkinDate, 'd MMM')} – ${format(checkoutDate, 'd MMM')}`
    }
    return 'Add dates'
  }

  const guestDisplay = () => {
    const total = adults + children
    if (total === 1 && children === 0 && infants === 0 && pets === 0) return 'Add guests'
    const parts: string[] = [`${total} guest${total !== 1 ? 's' : ''}`]
    if (infants > 0) parts.push(`${infants} infant${infants !== 1 ? 's' : ''}`)
    if (pets > 0) parts.push(`${pets} pet${pets !== 1 ? 's' : ''}`)
    return parts.join(', ')
  }

  const mobilePillSummary = () => {
    const parts: string[] = []
    if (whereQuery) parts.push(whereQuery)
    if (checkinDate && checkoutDate) parts.push(whenDisplay())
    const total = adults + children
    if (total > 1) parts.push(`${total} guests`)
    return parts.length > 0 ? parts.join(' · ') : 'Start your search'
  }

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const month1 = currentMonth
  const month2 = addMonths(currentMonth, 1)

  const getDays = (month: Date) => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }

  const isInRange = (date: Date) => {
    if (!checkinDate) return false
    if (checkoutDate) {
      return (
        (isAfter(date, checkinDate) || isSameDay(date, checkinDate)) &&
        (isBefore(date, checkoutDate) || isSameDay(date, checkoutDate))
      )
    }
    if (hoverDate && isAfter(hoverDate, checkinDate)) {
      return (
        (isAfter(date, checkinDate) || isSameDay(date, checkinDate)) &&
        (isBefore(date, hoverDate) || isSameDay(date, hoverDate))
      )
    }
    return false
  }

  const handleTimelineClick = (opt: (typeof TIMELINE_OPTIONS)[number]) => {
    setSelectedTimeline(opt.id)
    if (opt.id === 'exact') return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const anchor = checkinDate || today
    let end: Date
    if ('days' in opt && opt.days != null) {
      end = addDays(anchor, opt.days)
    } else if ('months' in opt && opt.months != null) {
      end = addMonths(anchor, opt.months)
    } else {
      return
    }
    setCheckin(format(anchor, 'yyyy-MM-dd'))
    setCheckout(format(end, 'yyyy-MM-dd'))
    setHoverDate(null)
    setUserHasSelectedDates(true)
    if ('months' in opt && opt.months && opt.months > 1) {
      setCurrentMonth(anchor)
    }
  }

  const handleDateClick = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (isBefore(date, today)) return

    const dateStr = format(date, 'yyyy-MM-dd')

    if (!checkinDate || (checkinDate && checkoutDate)) {
      setCheckin(dateStr)
      setCheckout('')
      setHoverDate(null)
      setSelectedTimeline('exact')
      setUserHasSelectedDates(true)
      return
    }

    if (checkinDate && !checkoutDate) {
      if (isBefore(date, checkinDate)) {
        setCheckin(dateStr)
        setCheckout('')
        setSelectedTimeline('exact')
        setUserHasSelectedDates(true)
        return
      }
      setCheckout(dateStr)
      setHoverDate(null)
      setSelectedTimeline('exact')
      setUserHasSelectedDates(true)
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (whereQuery) {
      params.set('query', whereQuery)
      params.set('location', whereQuery)
      // Persist to recent searches
      try {
        const updated = [whereQuery, ...recentSearches.filter(s => s !== whereQuery)].slice(0, 3)
        setRecentSearches(updated)
        localStorage.setItem('cb_recentSearches', JSON.stringify(updated))
      } catch {}
    }
    if (checkin) params.set('checkin', checkin)
    if (checkout) params.set('checkout', checkout)
    const totalGuests = adults + children
    if (totalGuests > 1) params.set('guests', String(totalGuests))
    if (accommodationOnly) params.set('accommodation', 'true')
    router.push(`/search?${params.toString()}`)
    setActiveSlot(null)
    setMobileModalOpen(false)
    setMobileWhereImmersive(false)
    setMobilePanel('where')
    setWhereQuery('')
  }

  const handleClearAll = () => {
    setWhereQuery('')
    setCheckin('')
    setCheckout('')
    setHoverDate(null)
    setAdults(1)
    setChildren(0)
    setInfants(0)
    setPets(0)
    setUserHasSelectedDates(false)
    setSelectedTimeline('exact')
    setMobilePanel('where')
    setMobileWhereImmersive(false)
  }

  // ── Slot toggle helper ────────────────────────────────────────────────────
  const toggleSlot = (slot: ActiveSlot) => {
    setActiveSlot((prev) => (prev === slot ? null : slot))
  }

  // ── Slot background classes
  const slotClass = (slot: ActiveSlot) =>
    `flex-1 min-w-0 flex flex-col text-left transition-all duration-200 rounded-full px-6 py-3.5 ${
      activeSlot === slot
        ? 'bg-white shadow-sm'
        : hoveredSlot === slot && !activeSlot
        ? 'bg-gray-100'
        : 'bg-transparent'
    }`

  const dividerClass = (left: ActiveSlot, right: ActiveSlot) =>
    `w-px h-5 bg-gray-200 flex-shrink-0 transition-opacity duration-150 ${
      activeSlot === left || activeSlot === right ||
      hoveredSlot === left || hoveredSlot === right
        ? 'opacity-0'
        : 'opacity-100'
    }`

  // ── Day cell renderer (shared desktop + mobile) ───────────────────────────
  const renderDayCell = (day: Date, month: Date, i: number) => {
    const inCurrentMonth = isSameMonth(day, month)
    const isStart = checkinDate ? isSameDay(day, checkinDate) : false
    const isEnd = checkoutDate ? isSameDay(day, checkoutDate) : false
    const inRange = isInRange(day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isDisabled = isBefore(day, today)
    const isSelected = isStart || isEnd

    const rangeBgClass =
      inRange && isStart
        ? 'bg-[linear-gradient(to_right,transparent_50%,#eff6ff_50%)]'
        : inRange && isEnd
          ? 'bg-[linear-gradient(to_right,#eff6ff_50%,transparent_50%)]'
          : inRange
            ? 'bg-blue-50'
            : ''

    return (
      <div
        key={i}
        className={[
          'w-full h-full flex items-center justify-center',
          rangeBgClass,
          !inCurrentMonth && 'invisible pointer-events-none',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          disabled={isDisabled || !inCurrentMonth}
          onClick={() => handleDateClick(day)}
          onMouseEnter={() =>
            !checkoutDate && inCurrentMonth && !isDisabled && setHoverDate(day)
          }
          className={[
            'text-[14px] font-medium transition-colors flex items-center justify-center',
            isSelected
              ? 'w-10 h-10 rounded-full bg-[#003580] text-white hover:bg-[#003580]'
              : 'w-full h-full min-w-0 min-h-0',
            !inCurrentMonth ? 'invisible pointer-events-none' : '',
            isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'cursor-pointer',
            inRange && !isSelected && 'text-[#003580]',
            !inRange && !isSelected && !isDisabled
              ? 'hover:bg-gray-100 rounded-full text-gray-800'
              : '',
            !inRange && !isSelected ? 'rounded-full' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {inCurrentMonth ? format(day, 'd') : ''}
        </button>
      </div>
    )
  }

  function renderGymSuggestBlock(
    variant: 'desktop' | 'mobile',
    opts?: { compact?: boolean },
  ) {
    if (!showGymSuggest) return null
    const q = whereQuery.trim()
    if (q.length < 2) return null

    const mobileCompact = variant === 'mobile' && opts?.compact

    const rowClass =
      variant === 'desktop'
        ? 'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-gray-50 group'
        : mobileCompact
          ? 'flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left touch-manipulation'
          : 'flex w-full items-center gap-3 py-1 text-left touch-manipulation'

    const iconWrap =
      variant === 'desktop'
        ? 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-200'
        : mobileCompact
          ? 'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100'
          : 'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100'

    const outerMb = variant === 'desktop' ? 'mb-4' : mobileCompact ? 'mb-2' : 'mb-5'
    const titleMb = mobileCompact ? 'mb-1.5' : 'mb-3'
    const titleSize = variant === 'desktop' ? 'text-[11px]' : mobileCompact ? 'text-[10px]' : 'text-xs'
    const listMaxH = mobileCompact ? 'max-h-28' : 'max-h-56'

    return (
      <div className={outerMb}>
        <p className={`${titleMb} font-semibold uppercase tracking-widest text-gray-400 ${titleSize}`}>
          Gyms on CombatStay
        </p>
        {gymDidYouMean && gymSuggestions.length > 0 ? (
          <p
            className={`mb-2 rounded-lg bg-[#003580]/5 px-2.5 py-2 text-[#003580] ${
              variant === 'desktop' ? 'text-xs leading-snug' : mobileCompact ? 'text-[11px] leading-snug' : 'text-[13px] leading-snug'
            }`}
          >
            No exact name match — showing similar gyms (fuzzy match on our catalog).
          </p>
        ) : null}
        {gymSuggestLoading ? (
          <p className={`text-gray-500 ${mobileCompact ? 'text-xs' : 'text-sm'}`}>Searching gyms…</p>
        ) : gymSuggestions.length > 0 ? (
          <div className={`${listMaxH} space-y-0.5 overflow-y-auto pr-1`}>
            {gymSuggestions.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => openGymProfile(g.id)}
                className={rowClass}
              >
                <div className={iconWrap}>
                  <Building2
                    className={
                      variant === 'desktop'
                        ? 'h-4 w-4 text-gray-600'
                        : mobileCompact
                          ? 'h-3.5 w-3.5 text-gray-600'
                          : 'h-5 w-5 text-gray-600'
                    }
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div
                    className={`truncate font-semibold text-gray-900 ${
                      mobileCompact ? 'text-xs' : 'text-sm'
                    }`}
                  >
                    {g.name}
                  </div>
                  <div className={`text-gray-500 ${mobileCompact ? 'mt-0 text-[10px]' : 'mt-0.5 text-xs'}`}>
                    {[g.city, g.country].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className={`leading-snug text-gray-500 ${mobileCompact ? 'text-xs' : 'text-sm'}`}>
            No gym by that exact name yet. Try a city, or tap Search to see similar camps.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">

      {/* ── Category Tabs (desktop only, outside containerRef) ── */}
      <div className={`${showTabs ? 'hidden md:flex' : 'hidden'} justify-center items-center gap-10 mb-5`}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              const id = cat.id as 'gyms' | 'train-stay' | 'seminars'
              setActiveCategory(id)
              onCategoryChange?.(id)
            }}
            className="relative flex items-center gap-2 pb-2.5 group"
          >
            {cat.isNew && (
              <span className="absolute -top-1.5 -right-5 bg-[#003580] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                NEW
              </span>
            )}
            <span className="text-[30px] transition-transform duration-300 ease-out group-hover:scale-125 inline-block select-none leading-none">
              {cat.emoji}
            </span>
            <span
              className={`text-xs font-medium transition-colors duration-150 ${
                activeCategory === cat.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
              }`}
            >
              {cat.label}
            </span>
            <span
              className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-200 ${
                activeCategory === cat.id ? 'bg-gray-900 opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE: Slim pill trigger → opens full-screen modal
          ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => {
            setMobileWhereImmersive(false)
            setMobileModalOpen(true)
            setMobilePanel('where')
          }}
          className={`w-full flex items-center gap-3 bg-white rounded-full px-4 py-4 text-left transition-shadow ${
            yellowBorder
              ? 'shadow-lg ring-[3px] ring-[#febb02]'
              : 'shadow-md hover:shadow-lg ring-1 ring-gray-200'
          }`}
        >
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={2.5} />
          <span className="flex-1 text-sm text-gray-400 truncate">Start your search</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP: Existing horizontal pill + dropdowns
          ══════════════════════════════════════════════════════════ */}
      <div ref={containerRef} className="relative hidden md:block">
        <div
          className={`relative flex items-center rounded-full transition-all duration-200 ${
            yellowBorder
              ? 'shadow-lg ring-[3px] ring-[#febb02]'
              : activeSlot
              ? 'shadow-2xl ring-1 ring-gray-200'
              : 'shadow-md hover:shadow-lg ring-1 ring-gray-200'
          } ${activeSlot ? 'bg-gray-100' : 'bg-white'}`}
          onMouseLeave={() => setHoveredSlot(null)}
        >
          {/* WHERE */}
          <button
            type="button"
            onClick={() => toggleSlot('where')}
            onMouseEnter={() => setHoveredSlot('where')}
            className={slotClass('where')}
          >
            <span className="text-xs font-bold text-gray-800 tracking-wide">Where</span>
            <span className="text-sm text-gray-400 truncate mt-0.5">
              {whereQuery || CATEGORY_SUBTITLES[activeCategory]}
            </span>
          </button>

          <div className={dividerClass('where', 'when')} />

          {/* WHEN */}
          <button
            type="button"
            onClick={() => toggleSlot('when')}
            onMouseEnter={() => setHoveredSlot('when')}
            className={slotClass('when')}
          >
            <span className="text-xs font-bold text-gray-800 tracking-wide">When</span>
            <span
              className={`text-sm mt-0.5 ${
                userHasSelectedDates && checkinDate && checkoutDate
                  ? 'text-gray-700 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {whenDisplay()}
            </span>
          </button>

          <div className={dividerClass('when', 'who')} />

          {/* WHO */}
          <button
            type="button"
            onClick={() => toggleSlot('who')}
            onMouseEnter={() => setHoveredSlot('who')}
            className={slotClass('who')}
          >
            <span className="text-xs font-bold text-gray-800 tracking-wide">Who</span>
            <span className="text-sm text-gray-400 mt-0.5">{guestDisplay()}</span>
          </button>

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearch}
            onMouseEnter={() => setHoveredSlot('who')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-[#003580] hover:bg-[#003580]/90 active:scale-95 text-white rounded-full transition-all duration-300 ease-out font-semibold ${
              activeSlot ? 'px-5 py-3.5' : 'p-3.5'
            }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
            {activeSlot && (
              <span className="text-sm whitespace-nowrap">Search</span>
            )}
          </button>
        </div>

        {/* WHERE Dropdown */}
        {activeSlot === 'where' && (
          <div className="absolute top-[calc(100%+10px)] left-0 z-50 max-h-[min(480px,78vh)] w-1/2 min-w-[280px] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
            <div className="max-h-[min(480px,78vh)] overflow-y-auto overscroll-contain p-5">
              <input
                ref={whereInputRef}
                type="text"
                value={whereQuery}
                onChange={(e) => setWhereQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && whereQuery) setActiveSlot('when')
                }}
                placeholder={
                  activeCategory === 'gyms'
                    ? 'City, area, or gym name'
                    : activeCategory === 'train-stay'
                      ? 'City, area, or gym name'
                      : 'Search seminars'
                }
                className="mb-4 w-full border-b border-gray-100 pb-3 text-sm text-gray-800 outline-none placeholder-gray-400"
              />
              {renderGymSuggestBlock('desktop')}
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Suggested destinations
              </p>
              <div className="space-y-0.5">
                {SUGGESTED_DESTINATIONS.filter(
                  (d) =>
                    !whereQuery ||
                    d.name.toLowerCase().includes(whereQuery.toLowerCase()) ||
                    d.subtitle.toLowerCase().includes(whereQuery.toLowerCase())
                ).map((dest) => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => {
                      setWhereQuery(dest.type === 'nearby' ? '' : dest.name)
                      setActiveSlot('when')
                    }}
                    className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <WhereLocationIconTile visual={dest.visual} size="sm" />
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">{dest.name}</div>
                      <div className="text-xs text-gray-500">{dest.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WHEN Dropdown */}
        {activeSlot === 'when' && (
          <div className="absolute top-[calc(100%+10px)] left-0 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 p-8">
            <div className="grid grid-cols-2 gap-16">
              {[month1, month2].map((month, mi) => {
                const days = getDays(month)
                return (
                  <div key={mi}>
                    <div className="flex items-center justify-between mb-5">
                      {mi === 0 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                      ) : (
                        <div className="w-8" />
                      )}
                      <h3 className="text-sm font-medium text-gray-900">
                        {format(month, 'MMMM yyyy')}
                      </h3>
                      {mi === 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                    <div className="grid grid-cols-7 mb-3">
                      {WEEK_DAYS.map((d) => (
                        <div key={d} className="text-xs font-medium text-gray-500 text-center py-1.5">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-[3.25rem]">
                      {days.map((day, i) => renderDayCell(day, month, i))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-2.5 pb-2 flex flex-wrap gap-2">
              {TIMELINE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTimelineClick(opt)}
                  className={`px-3 py-1.5 text-xs font-normal rounded-full transition-colors ${
                    selectedTimeline === opt.id
                      ? 'border border-gray-900 text-gray-900 bg-gray-50'
                      : 'border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WHO Dropdown */}
        {activeSlot === 'who' && (
          <div className="absolute top-[calc(100%+10px)] right-0 w-1/2 min-w-[280px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 p-6">
            <GuestCounter label="Adults" subtitle="Ages 13 or above" value={adults} onChange={setAdults} min={1} />
            <GuestCounter label="Children" subtitle="Ages 2–12" value={children} onChange={setChildren} />
            <GuestCounter label="Infants" subtitle="Under 2" value={infants} onChange={setInfants} />
            <GuestCounter label="Pets" subtitle="Bringing a service animal?" value={pets} onChange={setPets} />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE FULL-SCREEN SEARCH MODAL — slides down from top
          Rendered in a portal so parent transforms don't trap it.
          ══════════════════════════════════════════════════════════ */}
      {mobileModalOpen && mounted && createPortal(
        <div
          className={`fixed inset-0 z-[200] flex min-h-[100dvh] flex-col overflow-hidden overscroll-none animate-slide-down md:hidden bg-gray-100`}
          style={mobileModalViewportH ? { height: `${mobileModalViewportH}px` } : undefined}
        >
          {mobileWhereImmersive && mobilePanel === 'where' ? (
            /* Immersive Where: inset from top so rounded sheet reads like Airbnb (not flush full-bleed) */
            <div className="flex min-h-0 flex-1 flex-col pt-[max(18px,calc(env(safe-area-inset-top)+14px))]">
              <div
                ref={immersiveSheetRef}
                className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-10px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06]"
                style={{
                  transform: immersiveSheetTranslateY ? `translate3d(0, ${immersiveSheetTranslateY}px, 0)` : undefined,
                  transition: immersiveSheetDragging
                    ? 'none'
                    : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: immersiveSheetDragging ? 'transform' : undefined,
                }}
              >
                <div
                  className="flex-shrink-0 px-4 pt-3 pb-2"
                  onTouchStart={(e) => {
                    immersiveHeaderTouchY.current = e.touches[0]?.clientY ?? 0
                  }}
                  onTouchEnd={(e) => {
                    const t = e.changedTouches[0]
                    if (!t) return
                    if (t.clientY - immersiveHeaderTouchY.current > 72) closeImmersiveWhere()
                  }}
                >
                <div
                  ref={immersiveWhereSearchBarRef}
                  className="flex items-stretch gap-0.5 rounded-2xl border border-gray-200 bg-white px-1 py-1 shadow-sm ring-1 ring-black/[0.04]"
                >
                  <button
                    type="button"
                    aria-label="Back"
                    onClick={closeImmersiveWhere}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-gray-900 active:bg-gray-100"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
                  </button>
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2">
                    <Search className="h-4 w-4 flex-shrink-0 text-gray-500" strokeWidth={2.25} />
                    <input
                      ref={mobileWhereInputRef}
                      type="text"
                      value={whereQuery}
                      onChange={(e) => setWhereQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setMobileWhereImmersive(false)
                          setMobilePanel('when')
                        }
                      }}
                      placeholder="Search destinations"
                      className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    {whereQuery ? (
                      <button
                        type="button"
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full active:bg-gray-100"
                        onClick={() => setWhereQuery('')}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    ) : null}
                  </div>
                </div>
                </div>
                <div
                  ref={immersiveScrollRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
                  onTouchStart={(e) => {
                    const el = e.currentTarget
                    immersiveScrollTouch.current = {
                      y: e.touches[0]?.clientY ?? 0,
                      scrollTop: el.scrollTop,
                    }
                  }}
                  onTouchEnd={(e) => {
                    const el = e.currentTarget
                    const t = e.changedTouches[0]
                    if (!t) return
                    const dy = t.clientY - immersiveScrollTouch.current.y
                    if (immersiveScrollTouch.current.scrollTop <= 0 && el.scrollTop <= 0 && dy > 88) {
                      closeImmersiveWhere()
                    }
                  }}
                >
                {renderGymSuggestBlock('mobile')}
                {recentSearches.length > 0 && !whereQuery ? (
                  <div className="mb-6 mt-1">
                    <p className="mb-3 text-[12px] font-medium text-gray-700">Recent searches</p>
                    <div className="space-y-1">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setWhereQuery(s)
                            setMobileWhereImmersive(false)
                            setMobilePanel('when')
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left touch-manipulation active:bg-gray-100"
                        >
                          <WhereRecentSearchIconTile label={s} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-medium leading-tight text-gray-900">{s}</div>
                            <div className="mt-0.5 text-[12px] leading-tight text-gray-500">
                              {whereRowSubtitleForLabel(s)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div>
                  <p className="mb-3 text-[12px] font-medium text-gray-700">Suggested destinations</p>
                  <div className="space-y-1">
                    {mobileFilteredSuggested.map((dest) => (
                      <button
                        key={dest.name}
                        type="button"
                        onClick={() => {
                          setWhereQuery(dest.type === 'nearby' ? '' : dest.name)
                          setMobileWhereImmersive(false)
                          setMobilePanel('when')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left touch-manipulation active:bg-gray-100"
                      >
                        <WhereLocationIconTile visual={dest.visual} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-medium leading-tight text-gray-900">{dest.name}</div>
                          <div className="mt-0.5 text-[12px] leading-tight text-gray-500">{dest.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header: safe-area top padding, category tabs, close control */}
              <div className="relative flex-shrink-0 px-4 pt-[max(1.75rem,calc(env(safe-area-inset-top)+1.125rem))] pb-4">
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => {
                    setMobileWhereImmersive(false)
                    setMobileModalOpen(false)
                  }}
                  className="absolute right-4 top-[max(1.75rem,calc(env(safe-area-inset-top)+1.125rem))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-gray-200/90 shadow-[0_2px_6px_rgba(15,23,42,0.1),0_6px_20px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.06)]"
                >
                  <X className="w-5 h-5 text-gray-800" strokeWidth={2} />
                </button>
                <nav
                  className="flex justify-center gap-5 sm:gap-9 px-12"
                  aria-label="Search category"
                >
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.Icon
                    const isActive = activeCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const id = cat.id as 'gyms' | 'train-stay' | 'seminars'
                          setActiveCategory(id)
                          onCategoryChange?.(id)
                        }}
                        className="relative flex min-w-0 flex-col items-center gap-1.5 pb-2.5 pt-1"
                      >
                        {cat.isNew && (
                          <span className="absolute -top-0.5 right-0 translate-x-1/2 bg-[#003580] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            NEW
                          </span>
                        )}
                        <CatIcon
                          className={`w-8 h-8 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
                          strokeWidth={1.85}
                        />
                        <span
                          className={`text-sm font-medium tracking-tight whitespace-nowrap ${
                            isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {cat.label}
                        </span>
                        <span
                          className={`absolute bottom-0 left-1/2 h-[3px] w-10 max-w-full -translate-x-1/2 rounded-full transition-opacity ${
                            isActive ? 'bg-gray-900 opacity-100' : 'opacity-0'
                          }`}
                        />
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* ── Scrollable cards: Where grows to use space above When/Who (Airbnb-style sheet fill) ── */}
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain px-4 pb-4">
                {/* ══ WHERE card ══ */}
                {mobilePanel === 'where' ? (
                <div className="relative flex flex-col overflow-hidden rounded-3xl border border-gray-100/90 bg-white px-4 pt-4 pb-0 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.07),0_20px_48px_-12px_rgba(15,23,42,0.06)]">
                  <h2 className="mb-3 flex-shrink-0 text-2xl font-bold text-gray-900">Where?</h2>

                  {/* Search input */}
                  <div
                    ref={compactWhereSearchBarRef}
                    className="mb-3 flex flex-shrink-0 items-center gap-3 rounded-xl border border-gray-200/90 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
                    onClick={() => setMobileWhereImmersive(true)}
                  >
                    <Search className="h-4 w-4 flex-shrink-0 text-gray-500" strokeWidth={2.25} />
                    <input
                      ref={mobileWhereInputRef}
                      type="text"
                      value={whereQuery}
                      onChange={(e) => setWhereQuery(e.target.value)}
                      onFocus={() => setMobileWhereImmersive(true)}
                      onClick={() => setMobileWhereImmersive(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setMobilePanel('when')
                      }}
                      placeholder="Search destinations"
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                    />
                    {whereQuery && (
                      <button type="button" onClick={() => setWhereQuery('')} className="p-1">
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>

                  <div className="flex-shrink-0">{renderGymSuggestBlock('mobile')}</div>

                  {/* Recents + suggested: preview with fade; immersive = full list */}
                  {((recentSearches.length > 0 && !whereQuery.trim()) || mobileFilteredSuggested.length > 0) ? (
                    <div className="relative mt-1 overflow-hidden max-h-[min(44dvh,20rem)] pb-4">
                      {recentSearches.length > 0 && !whereQuery.trim() ? (
                        <div className="mb-3 flex-shrink-0">
                          <p className="mb-2 text-[12px] font-medium text-gray-700">Recent searches</p>
                          <div className="space-y-1">
                            {recentSearches.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setWhereQuery(s)
                                  setMobilePanel('when')
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left touch-manipulation active:bg-gray-50"
                              >
                                <WhereRecentSearchIconTile label={s} size="md" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[14px] font-medium leading-tight text-gray-900">{s}</div>
                                  <div className="mt-0.5 truncate text-[12px] leading-tight text-gray-500">
                                    {whereRowSubtitleForLabel(s)}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {mobileFilteredSuggested.length > 0 ? (
                        <div
                          className={`overflow-hidden ${
                            recentSearches.length > 0 && !whereQuery.trim()
                              ? 'mt-2 pt-2'
                              : ''
                          }`}
                        >
                          <p className="mb-2 flex-shrink-0 text-[12px] font-medium text-gray-700">
                            Suggested destinations
                          </p>
                          <div className="space-y-1">
                            {mobileFilteredSuggested.slice(0, 8).map((dest) => (
                              <button
                                key={dest.name}
                                type="button"
                                onClick={() => {
                                  setWhereQuery(dest.type === 'nearby' ? '' : dest.name)
                                  setMobilePanel('when')
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left touch-manipulation active:bg-gray-50"
                              >
                                <WhereLocationIconTile visual={dest.visual} size="md" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[14px] font-medium leading-tight text-gray-900">{dest.name}</div>
                                  <div className="mt-0.5 truncate text-[12px] leading-tight text-gray-500">{dest.subtitle}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div
                      className="min-h-[8rem] flex-shrink-0"
                      aria-hidden
                    />
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex-shrink-0 bg-gradient-to-t from-white/85 via-white/65 to-transparent pt-0.5 pb-0.5">
                    <div className="px-4">
                      <div className="border-t border-gray-100/90">
                      <button
                        type="button"
                        onClick={() => setMobileWhereImmersive(true)}
                        className="flex w-full justify-center py-1 touch-manipulation"
                        aria-label="Expand destination search"
                      >
                        <ChevronDown className="h-4 w-4 text-gray-400" strokeWidth={2} />
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Collapsed WHERE */
                <button
                  type="button"
                  onClick={() => setMobilePanel('where')}
                  className="flex w-full touch-manipulation items-center justify-between rounded-2xl border border-gray-200/90 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.055),0_14px_32px_-8px_rgba(15,23,42,0.04)]"
                >
                  <span className="text-sm text-gray-500 font-medium">Where</span>
                  <span className="text-sm font-semibold text-gray-900">{whereQuery || 'Anywhere'}</span>
                </button>
              )}

              {/* ══ WHEN card ══ */}
              {mobilePanel === 'when' ? (
                /* Expanded WHEN */
                <div className="rounded-3xl border border-gray-100/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.07),0_20px_48px_-12px_rgba(15,23,42,0.06)]">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">When?</h2>

                  {/* Timeline chips */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {TIMELINE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleTimelineClick(opt)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors touch-manipulation ${
                          selectedTimeline === opt.id
                            ? 'border-gray-900 text-gray-900 bg-gray-50 font-semibold'
                            : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Single-month calendar */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                      aria-label="Next month"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 mb-2">
                    {WEEK_DAYS.map((d) => (
                      <div key={d} className="text-xs font-medium text-gray-400 text-center py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 auto-rows-[2.75rem]">
                    {getDays(currentMonth).map((day, i) => renderDayCell(day, currentMonth, i))}
                  </div>
                </div>
              ) : (
                /* Collapsed WHEN */
                <button
                  type="button"
                  onClick={() => setMobilePanel('when')}
                  className="flex w-full touch-manipulation items-center justify-between rounded-2xl border border-gray-200/90 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.055),0_14px_32px_-8px_rgba(15,23,42,0.04)]"
                >
                  <span className="text-sm text-gray-500 font-medium">When</span>
                  <span className={`text-sm font-semibold ${userHasSelectedDates && checkinDate ? 'text-gray-900' : 'text-gray-400'}`}>
                    {whenDisplay()}
                  </span>
                </button>
              )}

              {/* ══ WHO card ══ */}
              {mobilePanel === 'who' ? (
                /* Expanded WHO */
                <div className="rounded-3xl border border-gray-100/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.07),0_20px_48px_-12px_rgba(15,23,42,0.06)]">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Who?</h2>
                  <GuestCounter label="Adults" subtitle="Ages 13 or above" value={adults} onChange={setAdults} min={1} />
                  <GuestCounter label="Children" subtitle="Ages 2–12" value={children} onChange={setChildren} />
                  <GuestCounter label="Infants" subtitle="Under 2" value={infants} onChange={setInfants} />
                  <GuestCounter label="Pets" subtitle="Bringing a service animal?" value={pets} onChange={setPets} />
                </div>
              ) : (
                /* Collapsed WHO */
                <button
                  type="button"
                  onClick={() => setMobilePanel('who')}
                  className="flex w-full touch-manipulation items-center justify-between rounded-2xl border border-gray-200/90 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.055),0_14px_32px_-8px_rgba(15,23,42,0.04)]"
                >
                  <span className="text-sm text-gray-500 font-medium">Who</span>
                  <span className={`text-sm font-semibold ${(adults > 1 || children > 0 || infants > 0 || pets > 0) ? 'text-gray-900' : 'text-gray-400'}`}>
                    {guestDisplay()}
                  </span>
                </button>
              )}

          </div>

          {/* ── Sticky footer ── */}
          <div className="flex-shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between border-t border-gray-200/80 bg-gray-100">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm font-semibold text-gray-800 underline underline-offset-2 touch-manipulation"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center gap-2 bg-[#003580] hover:bg-[#003580]/90 active:scale-95 text-white px-6 py-3 rounded-full font-semibold text-sm transition-all touch-manipulation"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
              Search
            </button>
          </div>
            </>
          )}
        </div>,
        document.body
      )}

    </div>
  )
}
