'use client'

import { useState } from 'react'
import { 
  Info, 
  MapPin, 
  Image, 
  Dumbbell, 
  Clock, 
  Users, 
  BedDouble, 
  HelpCircle,
  Package,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  required?: boolean
}

interface GymEditSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  sections: {
    [key: string]: {
      completed: boolean
      required: boolean
    }
  }
}

const SIDEBAR_SECTIONS: SidebarItem[] = [
  { id: 'basic', label: 'Basic Info', icon: Info, required: true },
  { id: 'location', label: 'Location', icon: MapPin, required: true },
  { id: 'images', label: 'Photos', icon: Image, required: true },
  { id: 'disciplines', label: 'Disciplines & Amenities', icon: Dumbbell, required: true },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'trainers', label: 'Trainers', icon: Users },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'packages', label: 'Packages', icon: Package, required: true },
]

export function GymEditSidebar({ activeSection, onSectionChange, sections }: GymEditSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white h-screen overflow-y-auto">
      <div className="p-4 space-y-1">
        <div className="mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Edit Gym Profile</h2>
          <p className="text-xs text-gray-500">Complete all sections</p>
        </div>
        
        <nav className="space-y-1">
          {SIDEBAR_SECTIONS.map((section) => {
            const Icon = section.icon
            const sectionData = sections[section.id] || { completed: false, required: false }
            const isActive = activeSection === section.id
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#003580] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-gray-500")} />
                <span className="flex-1 text-left">{section.label}</span>
                {sectionData.completed ? (
                  <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-green-600")} />
                ) : section.required ? (
                  <Circle className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white/50" : "text-gray-300")} />
                ) : null}
              </button>
            )
          })}
        </nav>
        
        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Required sections:</span>
              <span className="font-medium text-gray-700">
                {Object.values(sections).filter(s => s.required && s.completed).length} / {Object.values(sections).filter(s => s.required).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
