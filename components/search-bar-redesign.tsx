'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
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

const SUGGESTED_DESTINATIONS = [
  { name: 'Nearby', subtitle: 'Find gyms close to you', type: 'nearby' as const },
  { name: 'Phuket', subtitle: 'Thailand', type: 'place' as const },
  { name: 'Bangkok', subtitle: 'Thailand', type: 'place' as const },
  { name: 'Krabi', subtitle: 'Thailand', type: 'place' as const },
  { name: 'Pattaya', subtitle: 'Thailand', type: 'place' as const },
  { name: 'Chiang Mai', subtitle: 'Thailand', type: 'place' as const },
]

const CATEGORIES = [
  { id: 'gyms', label: 'Gyms', emoji: '🥊' },
  { id: 'train-stay', label: 'Train & Stay', emoji: '🏨' },
  { id: 'seminars', label: 'Seminars', emoji: '🎓', isNew: true },
]

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
}: {
  showTabs?: boolean
  yellowBorder?: boolean
  activeCategory?: 'gyms' | 'train-stay' | 'seminars'
  accommodationOnly?: boolean
  initialQuery?: string
}) {
  const router = useRouter()
  const { checkin, setCheckin, checkout, setCheckout } = useBooking()

  const [activeCategory, setActiveCategory] = useState<'gyms' | 'train-stay' | 'seminars'>('gyms')
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>(null)
  const [hoveredSlot, setHoveredSlot] = useState<ActiveSlot>(null)
  const [selectedTimeline, setSelectedTimeline] = useState<(typeof TIMELINE_OPTIONS)[number]['id']>('exact')
  const [whereQuery, setWhereQuery] = useState(initialQuery)
  const [userHasSelectedDates, setUserHasSelectedDates] = useState(false)

  useEffect(() => {
    if (controlledCategory) setActiveCategory(controlledCategory)
  }, [controlledCategory])

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

  // ── Close on outside click — containerRef = pill + dropdowns only; clicks propagate to target
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

  // ── Focus Where input when slot opens ────────────────────────────────────
  useEffect(() => {
    if (activeSlot === 'where') {
      setTimeout(() => whereInputRef.current?.focus(), 60)
    }
  }, [activeSlot])

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
      // Stay on date picker — no auto-advance to WHO
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (whereQuery) {
      params.set('query', whereQuery)
      params.set('location', whereQuery)
    }
    if (checkin) params.set('checkin', checkin)
    if (checkout) params.set('checkout', checkout)
    const totalGuests = adults + children
    if (totalGuests > 1) params.set('guests', String(totalGuests))
    if (accommodationOnly) params.set('accommodation', 'true')
    router.push(`/search?${params.toString()}`)
    setActiveSlot(null)
  }

  // ── Slot toggle helper ────────────────────────────────────────────────────
  const toggleSlot = (slot: ActiveSlot) => {
    setActiveSlot((prev) => (prev === slot ? null : slot))
  }

  // ── Slot background classes — active slot white on gray pill, inactive follow pill
  const slotClass = (slot: ActiveSlot) =>
    `flex-1 min-w-0 flex flex-col text-left transition-all duration-200 rounded-full px-6 py-3.5 ${
      activeSlot === slot
        ? 'bg-white shadow-sm'
        : hoveredSlot === slot && !activeSlot
        ? 'bg-gray-100'
        : 'bg-transparent'
    }`

  // Divider fades when either adjacent slot is active OR hovered
  const dividerClass = (left: ActiveSlot, right: ActiveSlot) =>
    `w-px h-5 bg-gray-200 flex-shrink-0 transition-opacity duration-150 ${
      activeSlot === left || activeSlot === right ||
      hoveredSlot === left || hoveredSlot === right
        ? 'opacity-0'
        : 'opacity-100'
    }`

  return (
    <div className="w-full">

      {/* ── Category Tabs (outside containerRef — clicking them closes dropdown) ── */}
      <div className={`${showTabs ? 'hidden md:flex' : 'hidden'} justify-center items-center gap-10 mb-5`}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id as 'gyms' | 'train-stay' | 'seminars')}
            className="relative flex items-center gap-2 pb-2.5 group"
          >
            {cat.isNew && (
              <span className="absolute -top-1.5 -right-5 bg-[#008489] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                NEW
              </span>
            )}
            {/* Icon to the left, enlarges on hover */}
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
            {/* Active underline */}
            <span
              className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-200 ${
                activeCategory === cat.id ? 'bg-gray-900 opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ── Pill Search Bar + Dropdowns (containerRef = only this; category tabs = outside) ── */}
      <div ref={containerRef} className="relative">
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

          {/* Divider */}
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

          {/* Divider */}
          <div className={dividerClass('when', 'who')} />

          {/* WHO — identical flex-1 to WHERE and WHEN */}
          <button
            type="button"
            onClick={() => toggleSlot('who')}
            onMouseEnter={() => setHoveredSlot('who')}
            className={slotClass('who')}
          >
            <span className="text-xs font-bold text-gray-800 tracking-wide">Who</span>
            <span className="text-sm text-gray-400 mt-0.5">{guestDisplay()}</span>
          </button>

          {/* Search Button — absolutely positioned so it takes zero flex space */}
          <button
            type="button"
            onClick={handleSearch}
            onMouseEnter={() => setHoveredSlot('who')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-[#003580] hover:bg-[#003580]/90 active:scale-95 text-white rounded-full transition-all duration-300 ease-out font-semibold ${
              // On mobile keep icon-only so the WHO slot never gets clipped.
              activeSlot ? 'p-3.5 md:px-5 md:py-3.5' : 'p-3.5'
            }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
            {activeSlot && (
              <span className="hidden md:inline text-sm whitespace-nowrap">Search</span>
            )}
          </button>
        </div>

        {/* ── WHERE Dropdown ─────────────────────────────────────────────── */}
        {activeSlot === 'where' && (
          <div className="absolute top-[calc(100%+10px)] left-0 w-1/2 min-w-[280px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-5">
              {/* Inline text input */}
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
                    ? 'Search gyms'
                    : activeCategory === 'train-stay'
                      ? 'Search camps with accommodation'
                      : 'Search seminars'
                }
                className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none mb-4 border-b border-gray-100 pb-3"
              />
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
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                      {dest.type === 'nearby' ? (
                        <Navigation className="w-4 h-4 text-gray-600" />
                      ) : (
                        <MapPin className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">{dest.name}</div>
                      <div className="text-xs text-gray-400">{dest.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── WHEN Dropdown — same width as the pill ────────────────────── */}
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
                      {days.map((day, i) => {
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
                                  ? 'w-12 h-12 rounded-full bg-[#003580] text-white hover:bg-[#003580]'
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
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Timeline quick-select — white space above and below */}
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

        {/* ── WHO Dropdown ───────────────────────────────────────────────── */}
        {activeSlot === 'who' && (
          <div className="absolute top-[calc(100%+10px)] right-0 w-1/2 min-w-[280px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 p-6">
            <GuestCounter
              label="Adults"
              subtitle="Ages 13 or above"
              value={adults}
              onChange={setAdults}
              min={1}
            />
            <GuestCounter
              label="Children"
              subtitle="Ages 2–12"
              value={children}
              onChange={setChildren}
            />
            <GuestCounter
              label="Infants"
              subtitle="Under 2"
              value={infants}
              onChange={setInfants}
            />
            <GuestCounter
              label="Pets"
              subtitle="Bringing a service animal?"
              value={pets}
              onChange={setPets}
            />
          </div>
        )}
      </div>
    </div>
  )
}
