'use client'

import { useState, useMemo } from 'react'
import { X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ClassScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  trainingSchedule: Record<string, Array<{ time: string; type?: string }>>
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

// Generate standard times (6am-10pm) for consistent modal size
const generateStandardTimes = (): string[] => {
  const times: string[] = []
  for (let hour = 6; hour <= 22; hour++) {
    times.push(`${hour.toString().padStart(2, '0')}:00`)
  }
  return times
}

const STANDARD_TIMES = generateStandardTimes()

// Color mapping for different class types - using site's color scheme
const getClassColor = (type?: string): string => {
  if (!type) return 'bg-gray-100 border border-gray-300 text-gray-700'
  
  const typeLower = type.toLowerCase()
  // Primary blue for Muay Thai
  if (typeLower.includes('muay thai') || typeLower.includes('muaythai') || typeLower.includes('muay')) {
    return 'bg-[#003580] text-white border border-[#003580]'
  }
  // Blue variants for Jiu Jitsu
  if (typeLower.includes('jiu jitsu') || typeLower.includes('jiujitsu') || typeLower.includes('bjj') || typeLower.includes('jitsu')) {
    return 'bg-blue-600 text-white border border-blue-600'
  }
  // Orange for Wrestling/Grappling/MMA
  if (typeLower.includes('wrestling') || typeLower.includes('grappling') || typeLower.includes('mma')) {
    return 'bg-orange-500 text-white border border-orange-500'
  }
  // Green for Fitness/Strength
  if (typeLower.includes('fit') || typeLower.includes('s&c') || typeLower.includes('strength') || typeLower.includes('hyrox') || typeLower.includes('kettlebell') || typeLower.includes('kettle')) {
    return 'bg-green-600 text-white border border-green-600'
  }
  // Purple for Yoga/Mobility
  if (typeLower.includes('yoga') || typeLower.includes('mobility')) {
    return 'bg-purple-500 text-white border border-purple-500'
  }
  // Gray for Boxing and others
  if (typeLower.includes('boxing') || typeLower.includes('kickboxing')) {
    return 'bg-gray-700 text-white border border-gray-700'
  }
  return 'bg-gray-100 border border-gray-300 text-gray-700'
}

// Normalize time format to HH:MM (e.g., "6:00" -> "06:00", "9:30" -> "09:30")
const normalizeTime = (time: string): string => {
  const parts = time.split(':')
  if (parts.length !== 2) return time
  const hour = parts[0].padStart(2, '0')
  const minute = parts[1].padStart(2, '0')
  return `${hour}:${minute}`
}

export function ClassScheduleModal({ isOpen, onClose, trainingSchedule }: ClassScheduleModalProps) {
  const [selectedDay, setSelectedDay] = useState('monday')

  // Get sessions for selected day
  const sessions = trainingSchedule[selectedDay] || []
  const sessionCount = sessions.length

  // Group sessions by time, matching to nearest standard time slot
  const sessionsByTime: Record<string, Array<{ time: string; type?: string }>> = {}
  sessions.forEach(session => {
    const normalizedTime = normalizeTime(session.time)
    // Find the nearest standard time slot (round to nearest hour)
    const [hour, minute] = normalizedTime.split(':').map(Number)
    const roundedHour = minute >= 30 ? hour + 1 : hour
    const standardTime = `${roundedHour.toString().padStart(2, '0')}:00`
    
    // Only include if within our standard times range (6am-10pm)
    if (STANDARD_TIMES.includes(standardTime)) {
      if (!sessionsByTime[standardTime]) {
        sessionsByTime[standardTime] = []
      }
      sessionsByTime[standardTime].push(session)
    }
  })

  // Sort times
  const sortedTimes = Object.keys(sessionsByTime).sort((a, b) => {
    const [aHour, aMin] = a.split(':').map(Number)
    const [bHour, bMin] = b.split(':').map(Number)
    return aHour * 60 + aMin - (bHour * 60 + bMin)
  })

  // Always use standard times to maintain consistent modal size
  // Classes will be matched to the nearest standard time slot
  const displayTimes = STANDARD_TIMES

  // Get days with sessions
  const daysWithSessions = DAYS_OF_WEEK.filter(day => 
    trainingSchedule[day.key] && trainingSchedule[day.key].length > 0
  )

  const currentDayIndex = DAYS_OF_WEEK.findIndex(d => d.key === selectedDay)
  const hasPrevious = currentDayIndex > 0 && trainingSchedule[DAYS_OF_WEEK[currentDayIndex - 1].key]?.length > 0
  const hasNext = currentDayIndex < DAYS_OF_WEEK.length - 1 && trainingSchedule[DAYS_OF_WEEK[currentDayIndex + 1].key]?.length > 0

  const navigateDay = (direction: 'prev' | 'next') => {
    const currentIndex = DAYS_OF_WEEK.findIndex(d => d.key === selectedDay)
    if (direction === 'prev' && currentIndex > 0) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (trainingSchedule[DAYS_OF_WEEK[i].key]?.length > 0) {
          setSelectedDay(DAYS_OF_WEEK[i].key)
          return
        }
      }
    } else if (direction === 'next' && currentIndex < DAYS_OF_WEEK.length - 1) {
      for (let i = currentIndex + 1; i < DAYS_OF_WEEK.length; i++) {
        if (trainingSchedule[DAYS_OF_WEEK[i].key]?.length > 0) {
          setSelectedDay(DAYS_OF_WEEK[i].key)
          return
        }
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full p-0 bg-transparent border-0 shadow-none overflow-visible md:overflow-visible">
        {/* Mobile: Backdrop overlay */}
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        
        {/* Mobile: Slide-up bottom sheet - All content visible, no scrolling */}
        <div className="md:hidden fixed inset-x-0 top-[20%] bottom-0 bg-white rounded-t-2xl shadow-2xl z-50 flex flex-col animate-slide-up">
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-base font-bold text-gray-900">
              {DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Day Navigation - Larger buttons */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 overflow-x-auto no-scrollbar flex-shrink-0">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = day.key === selectedDay
              const hasSessions = trainingSchedule[day.key]?.length > 0
              
              return (
                <button
                  key={day.key}
                  onClick={() => hasSessions && setSelectedDay(day.key)}
                  disabled={!hasSessions}
                  className={`
                    px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all flex-shrink-0
                    ${isSelected
                      ? 'bg-[#003580] text-white shadow-sm'
                      : hasSessions
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  {day.label.slice(0, 3)}
                </button>
              )
            })}
          </div>

          {/* Mobile Schedule Content - Fits all times without scrolling */}
          <div className="flex-1 flex flex-col min-h-0 px-3 py-2.5">
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
              <div className="flex-1 grid grid-rows-[repeat(17,minmax(0,1fr))] divide-y divide-gray-100">
                {displayTimes.map((time, index) => {
                  const normalizedTime = normalizeTime(time)
                  const timeSessions = sessionsByTime[normalizedTime] || []
                  const isEven = index % 2 === 0
                  const hasClasses = timeSessions.length > 0
                  
                  return (
                    <div 
                      key={time} 
                      className={`
                        flex items-center gap-2 px-2.5 py-1 border-b last:border-0 border-gray-100
                        ${isEven ? 'bg-white' : 'bg-gray-50/50'}
                      `}
                    >
                      <div className="w-11 flex-shrink-0">
                        <span className="text-[10px] font-semibold text-gray-700">{time}</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1 items-center min-h-[16px]">
                        {hasClasses ? (
                          timeSessions.map((session, sessionIndex) => (
                            <div
                              key={sessionIndex}
                              className={`
                                px-2 py-0.5 rounded text-[9px] font-medium leading-tight
                                ${getClassColor(session.type)}
                              `}
                            >
                              {session.type || 'Class'}
                            </div>
                          ))
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobile Footer Info - Always visible at bottom */}
            <div className="pt-2 mt-2 border-t border-gray-200 flex-shrink-0">
              <p className="text-[9px] text-gray-500 leading-tight text-center">
                Class durations may vary. Please check with the gym for specific class lengths and requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Desktop: Original Layout */}
        <div className="hidden md:block">
          {/* Floating Day Navigation - Outside the modal box */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-5 -mt-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = day.key === selectedDay
              const hasSessions = trainingSchedule[day.key]?.length > 0
              
              return (
                <button
                  key={day.key}
                  onClick={() => hasSessions && setSelectedDay(day.key)}
                  disabled={!hasSessions}
                  className={`
                    px-5 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all
                    ${isSelected
                      ? 'bg-[#003580] text-white shadow-md'
                      : hasSessions
                      ? 'bg-white text-gray-700 hover:border-2 hover:border-[#003580] hover:text-[#003580] shadow-sm'
                      : 'bg-white text-gray-400 cursor-not-allowed shadow-sm opacity-60'
                    }
                  `}
                >
                  {day.label}
                </button>
              )
            })}
          </div>

          {/* Main Modal Content Box with Background */}
          <div className="bg-white text-gray-900 border border-gray-200 rounded-lg shadow-xl overflow-hidden relative">
          {/* Close button in top right */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-8 space-y-6">
            {/* Selected Day Header */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label}
              </h2>
            </div>

            {/* Schedule Timeline - Always show all times for consistent size */}
            <div className="space-y-0">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {displayTimes.map((time, index) => {
                  // Normalize the display time to match the normalized session times
                  const normalizedTime = normalizeTime(time)
                  // Find sessions that match this time slot (exact match or within 30 minutes)
                  const timeSessions = sessionsByTime[normalizedTime] || []
                  const isEven = index % 2 === 0
                  const hasClasses = timeSessions.length > 0
                  
                  return (
                    <div 
                      key={time} 
                      className={`
                        flex items-center gap-4 px-4 py-1.5 border-b last:border-0 border-gray-100
                        ${isEven ? 'bg-white' : 'bg-gray-50/50'}
                      `}
                    >
                      <div className="w-16 flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-700">{time}</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                        {hasClasses ? (
                          timeSessions.map((session, sessionIndex) => (
                            <div
                              key={sessionIndex}
                              className={`
                                px-2 py-1 rounded-md font-medium text-[10px] shadow-sm
                                ${getClassColor(session.type)}
                              `}
                            >
                              {session.type || 'Class'}
                            </div>
                          ))
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pagination Dots */}
            {daysWithSessions.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                {DAYS_OF_WEEK.map((day) => {
                  const hasSessions = trainingSchedule[day.key]?.length > 0
                  if (!hasSessions) return null
                  const isSelected = day.key === selectedDay
                  return (
                    <button
                      key={day.key}
                      onClick={() => setSelectedDay(day.key)}
                      className={`
                        rounded-full transition-all duration-200
                        ${isSelected ? 'bg-[#003580] w-8 h-1.5' : 'bg-gray-300 w-1.5 h-1.5 hover:bg-gray-400'}
                      `}
                      aria-label={`Go to ${day.label}`}
                    />
                  )
                })}
              </div>
            )}

            {/* Footer Info */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed text-center">
                Class durations may vary. Please check with the gym for specific class lengths and requirements. 
                Some classes may require prior booking or have capacity limits.
              </p>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
