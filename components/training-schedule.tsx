'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClassScheduleModal } from '@/components/class-schedule-modal'

interface TrainingScheduleProps {
  trainingSchedule: Record<string, Array<{ time: string; type?: string }>>
}

export function TrainingSchedule({ trainingSchedule }: TrainingScheduleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check if there's any training schedule data
  const hasSchedule = Object.values(trainingSchedule).some(sessions => sessions && sessions.length > 0)

  if (!hasSchedule) {
    return null
  }

  return (
    <>
      <div className="mt-3 md:mt-4">
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="w-full border-2 border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white font-semibold text-sm md:text-base h-10 md:h-11 transition-all duration-200"
        >
          <Clock className="w-4 h-4 mr-2" />
          Class Schedule
        </Button>
      </div>

      <ClassScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trainingSchedule={trainingSchedule}
      />
    </>
  )
}
