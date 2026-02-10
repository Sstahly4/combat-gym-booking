'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, isAfter, startOfWeek, endOfWeek } from 'date-fns'

interface DateRangePickerProps {
  checkin: string
  checkout: string
  onCheckinChange: (date: string) => void
  onCheckoutChange: (date: string) => void
  className?: string
  forceOpen?: boolean // When true, calendar is always visible (for modal use)
  onClose?: () => void // Callback to close when used in modal (for Done button)
}

export function DateRangePicker({ checkin, checkout, onCheckinChange, onCheckoutChange, className = '', forceOpen = false, onClose }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(forceOpen)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobileRef = useRef(false)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    // Keep this as a ref so it doesn't trigger rerenders during resize
    isMobileRef.current = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    const onResize = () => {
      isMobileRef.current = window.innerWidth < 768
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const checkinDate = checkin ? new Date(checkin + 'T00:00:00') : null
  const checkoutDate = checkout ? new Date(checkout + 'T00:00:00') : null

  const formatDisplayDate = (date: Date) => {
    return format(date, 'd MMM')
  }

  const getDisplayText = () => {
    // Always show dates - use defaults if not provided
    const today = new Date()
    const nextDay = new Date(today)
    nextDay.setDate(today.getDate() + 2)
    
    const displayCheckin = checkinDate || today
    const displayCheckout = checkoutDate || nextDay
    
    return `${formatDisplayDate(displayCheckin)} - ${formatDisplayDate(displayCheckout)}`
  }

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Can't select past dates
    if (isBefore(date, today)) {
      return
    }

    // Mobile UX (Booking.com-like): 2-tap range selection (check-in then check-out),
    // does not auto-close — user confirms via Done or by tapping outside.
    if (isMobileRef.current) {
      // If no check-in yet OR both dates already set, start a new range
      if (!checkinDate || (checkinDate && checkoutDate)) {
        onCheckinChange(dateString)
        onCheckoutChange('')
        setHoverDate(null)
        return
      }

      // If check-in is set and checkout is not: set checkout (or reset if tapping before check-in)
      if (checkinDate && !checkoutDate) {
        if (isBefore(date, checkinDate)) {
          onCheckinChange(dateString)
          onCheckoutChange('')
          setHoverDate(null)
          return
        }
        onCheckoutChange(dateString)
        setHoverDate(null)
        return
      }
    }

    // Desktop UX: allow selecting a custom range with two clicks
    if (!checkinDate || (checkinDate && checkoutDate)) {
      onCheckinChange(dateString)
      onCheckoutChange('')
      setHoverDate(null)
      return
    }

    // Select checkout
    if (checkinDate && !checkoutDate) {
      if (isBefore(date, checkinDate)) {
        onCheckinChange(dateString)
        onCheckoutChange('')
        return
      }
      onCheckoutChange(dateString)
      setIsOpen(false)
    }
  }

  const isDateInRange = (date: Date) => {
    if (!checkinDate) return false
    if (checkoutDate) {
      return (isAfter(date, checkinDate) || isSameDay(date, checkinDate)) && 
             (isBefore(date, checkoutDate) || isSameDay(date, checkoutDate))
    }
    if (hoverDate && isAfter(hoverDate, checkinDate)) {
      return (isAfter(date, checkinDate) || isSameDay(date, checkinDate)) && 
             (isBefore(date, hoverDate) || isSameDay(date, hoverDate))
    }
    return false
  }

  const isDateStart = (date: Date) => {
    return checkinDate && isSameDay(date, checkinDate)
  }

  const isDateEnd = (date: Date) => {
    return checkoutDate && isSameDay(date, checkoutDate)
  }

  const isDateSelected = (date: Date) => {
    return isDateStart(date) || isDateEnd(date)
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return isBefore(date, today)
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const month1 = currentMonth
  const month2 = addMonths(currentMonth, 1)

  const getDaysForMonth = (month: Date, weekStartsOn: 0 | 1) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  const days1 = getDaysForMonth(month1, 1)
  const days2 = getDaysForMonth(month2, 1)

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const mobileMonths = (() => {
    const start = new Date()
    start.setDate(1)
    const months: Date[] = []
    for (let i = 0; i < 12; i++) months.push(addMonths(start, i))
    return months
  })()

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div 
        onClick={() => {
          // When opening, anchor the view around the selected check-in (or today)
          if (!isOpen) {
            const base = checkinDate || new Date()
            const anchored = new Date(base)
            anchored.setDate(1)
            setCurrentMonth(anchored)
          }
          setIsOpen(!isOpen)
        }}
        className="h-10 md:h-12 border-2 border-transparent focus-within:border-[#003580] rounded-sm bg-white cursor-pointer flex items-center px-2 md:px-3 hover:border-gray-300 transition-colors"
      >
        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2 md:mr-3 flex-shrink-0" />
        <div className="flex-1 text-xs md:text-base text-gray-700 min-w-0">
          {getDisplayText()}
        </div>
      </div>

      {/* Calendar Popup */}
      {(isOpen || forceOpen) && (
        <>
          {/* Backdrop - Show backdrop for normal use, not when forceOpen (modal handles its own backdrop) */}
          {!forceOpen && (
          <button
            type="button"
            aria-label="Close date picker"
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          )}

          {/* Mobile Bottom Sheet - Same design as homepage */}
          <div className="fixed inset-x-0 bottom-0 z-[60] md:hidden animate-slide-up bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 pointer-events-auto">
            {!forceOpen && (
            <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Select dates</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Tap a date to auto-select 1 night
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                aria-label="Close"
              >
                <span className="sr-only">Close</span>
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            )}

            {/* Weekday header */}
            <div className="px-4 pt-3">
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[11px] font-medium text-gray-500 text-center py-1">
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable months */}
            <div className="px-4 pb-4 max-h-[72vh] overflow-y-auto">
              {mobileMonths.map((m) => {
                const days = getDaysForMonth(m, 0) // Sunday start for mobile (matches Booking.com)
                return (
                  <div key={format(m, 'yyyy-MM')} className="pt-3">
                    <div className="text-base font-semibold text-gray-900 mb-2">
                      {format(m, 'MMMM yyyy')}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((day, idx) => {
                        const isCurrent = isSameMonth(day, m)
                        const isSelected = isDateSelected(day)
                        const inRange = isDateInRange(day)
                        const isStart = isDateStart(day)
                        const isEnd = isDateEnd(day)
                        // On mobile, we hide/disable filler days from adjacent months to avoid confusion
                        const isDisabled = isDateDisabled(day) || !isCurrent

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDateClick(day)
                            }}
                            disabled={isDisabled}
                            className={`
                              h-11 w-11 rounded-full text-sm font-medium transition-colors touch-manipulation
                              ${!isCurrent ? 'text-transparent' : 'text-gray-900'}
                              ${isDisabled ? 'cursor-not-allowed text-gray-300 opacity-20' : 'cursor-pointer active:bg-gray-200 hover:bg-gray-100'}
                              ${isSelected ? 'bg-[#003580] text-white hover:bg-[#003580] active:bg-[#003580]' : ''}
                              ${inRange && !isSelected ? 'bg-blue-50 text-[#003580]' : ''}
                              ${isStart && !isEnd ? 'rounded-r-none' : ''}
                              ${isEnd && !isStart ? 'rounded-l-none' : ''}
                              ${inRange && !isStart && !isEnd ? 'rounded-none' : ''}
                              ${!isCurrent ? 'opacity-40' : ''}
                            `}
                          >
                            {isCurrent ? format(day, 'd') : ''}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom actions */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {checkinDate && checkoutDate ? (
                  <span>
                    {formatDisplayDate(checkinDate)} → {formatDisplayDate(checkoutDate)}
                  </span>
                ) : (
                  <span>Select a date</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    onCheckinChange('')
                    onCheckoutChange('')
                    setHoverDate(null)
                  }}
                  className="text-xs font-medium text-[#003580] hover:underline"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (forceOpen && onClose) {
                      onClose()
                    } else {
                      setIsOpen(false)
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#003580] hover:bg-[#003580]/90 active:bg-[#003580]/80 rounded-md transition-colors touch-manipulation"
                >
                  Done
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Popup */}
          <div className={`hidden md:block ${forceOpen ? 'relative' : 'md:absolute md:top-full md:left-0 md:mt-2'} bg-white rounded-lg ${forceOpen ? 'shadow-sm' : 'shadow-2xl'} border border-gray-200 ${forceOpen ? '' : 'z-50'} p-6 ${forceOpen ? 'w-full' : 'w-[680px]'} max-w-[calc(100vw-2rem)]`}>
            {/* Two Month Calendar */}
            <div className="grid grid-cols-2 gap-8">
              {/* Month 1 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors touch-manipulation"
                    type="button"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h3 className="text-base font-semibold text-gray-900">
                    {format(month1, 'MMMM yyyy')}
                  </h3>
                  <div className="w-9" />
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days1.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, month1)
                    const isSelected = isDateSelected(day)
                    const inRange = isDateInRange(day)
                    const isStart = isDateStart(day)
                    const isEnd = isDateEnd(day)
                    const isDisabled = isDateDisabled(day)

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDateClick(day)}
                        onMouseEnter={() => !checkoutDate && setHoverDate(day)}
                        disabled={isDisabled}
                        className={`
                          h-10 w-10 rounded text-sm font-medium transition-colors
                          ${!isCurrentMonth ? 'text-gray-300' : ''}
                          ${isDisabled ? 'cursor-not-allowed text-gray-300 opacity-40' : 'cursor-pointer hover:bg-gray-100'}
                          ${isSelected ? 'bg-[#003580] text-white hover:bg-[#003580]' : ''}
                          ${inRange && !isSelected ? 'bg-blue-50 text-[#003580]' : ''}
                          ${isStart && !isEnd ? 'rounded-r-none' : ''}
                          ${isEnd && !isStart ? 'rounded-l-none' : ''}
                          ${inRange && !isStart && !isEnd ? 'rounded-none' : ''}
                          ${!isCurrentMonth ? 'opacity-40' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Month 2 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9" />
                  <h3 className="text-base font-semibold text-gray-900">
                    {format(month2, 'MMMM yyyy')}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors touch-manipulation"
                    type="button"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days2.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, month2)
                    const isSelected = isDateSelected(day)
                    const inRange = isDateInRange(day)
                    const isStart = isDateStart(day)
                    const isEnd = isDateEnd(day)
                    const isDisabled = isDateDisabled(day)

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDateClick(day)}
                        onMouseEnter={() => !checkoutDate && setHoverDate(day)}
                        disabled={isDisabled}
                        className={`
                          h-10 w-10 rounded text-sm font-medium transition-colors
                          ${!isCurrentMonth ? 'text-gray-300' : ''}
                          ${isDisabled ? 'cursor-not-allowed text-gray-300 opacity-40' : 'cursor-pointer hover:bg-gray-100'}
                          ${isSelected ? 'bg-[#003580] text-white hover:bg-[#003580]' : ''}
                          ${inRange && !isSelected ? 'bg-blue-50 text-[#003580]' : ''}
                          ${isStart && !isEnd ? 'rounded-r-none' : ''}
                          ${isEnd && !isStart ? 'rounded-l-none' : ''}
                          ${inRange && !isStart && !isEnd ? 'rounded-none' : ''}
                          ${!isCurrentMonth ? 'opacity-40' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#003580] hover:bg-gray-50 rounded transition-colors"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
