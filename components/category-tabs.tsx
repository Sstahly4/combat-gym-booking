'use client'

import { useState } from 'react'
import { Dumbbell, BedDouble, GraduationCap } from 'lucide-react'

const CATEGORIES = [
<<<<<<< HEAD
  { id: 'gyms',     label: 'Gyms',         Icon: Dumbbell },
  { id: 'train-stay',    label: 'Train & Stay', Icon: BedDouble },
  { id: 'seminars', label: 'Seminars',     Icon: GraduationCap, isNew: true },
=======
  { id: 'gyms', label: 'Gyms', Icon: Dumbbell },
  { id: 'train-stay', label: 'Train & Stay', Icon: BedDouble },
  { id: 'seminars', label: 'Seminars', Icon: GraduationCap, isNew: true },
>>>>>>> origin/mobile-model
]

export function CategoryTabs({
  value,
  onChange,
}: {
  value?: 'gyms' | 'train-stay' | 'seminars'
  onChange?: (v: 'gyms' | 'train-stay' | 'seminars') => void
}) {
  const [active, setActive] = useState<'gyms' | 'train-stay' | 'seminars'>('gyms')
  const [hovered, setHovered] = useState<string | null>(null)
  const current = value ?? active

  return (
    <div className="flex items-center gap-1 mb-0">
      {CATEGORIES.map(({ id, label, Icon, isNew }) => {
        const isActive = current === id
        const isHovered = hovered === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              const next = id as 'gyms' | 'train-stay' | 'seminars'
              setActive(next)
              onChange?.(next)
            }}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            className="relative flex items-center px-3 pt-1 pb-0 text-[15px] font-normal text-white transition-colors whitespace-nowrap"
          >
            <span className="relative inline-flex items-center gap-2">
              <Icon className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.9} />
              <span className="tracking-[-0.01em]">{label}</span>
              {isNew && (
                <span className="text-[9px] font-bold bg-white text-[#003580] rounded px-1 py-0.5 leading-none tracking-wide">
                  NEW
                </span>
              )}
              {/* Underline — matches just the content width */}
              <span
                className={`absolute -bottom-3 left-0 right-0 h-[2px] rounded-full transition-all duration-150 ${
                  isActive ? 'bg-white opacity-100' : isHovered ? 'bg-white opacity-40' : 'opacity-0'
                }`}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}
