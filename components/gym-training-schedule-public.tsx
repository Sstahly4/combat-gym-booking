'use client'

import { useState } from 'react'
import { TrainingSchedule } from '@/components/training-schedule'
import { managedImageDisplayUrl } from '@/lib/images/gym-image-variants'
import { cn } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'

type Session = { time: string; type?: string }

export function GymTrainingSchedulePublic({
  trainingSchedule,
  trainingScheduleImage,
  trainingScheduleUseImage,
  className,
}: {
  trainingSchedule?: Record<string, Session[]> | null
  trainingScheduleImage?: string | null
  trainingScheduleUseImage?: boolean
  className?: string
}) {
  const [imageExpanded, setImageExpanded] = useState(false)
  const imageSrc =
    trainingScheduleUseImage && trainingScheduleImage
      ? managedImageDisplayUrl(trainingScheduleImage)
      : null

  const hasStructured = Object.values(trainingSchedule ?? {}).some(
    (sessions) => sessions && sessions.length > 0,
  )

  if (imageSrc) {
    return (
      <div className={cn('mt-3 md:mt-4', className)}>
        <h3 className="mb-2.5 font-bold text-sm text-gray-900 md:mb-3 md:text-base">
          Class schedule
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={imageSrc}
            alt="Weekly class timetable"
            className={cn(
              'w-full cursor-zoom-in object-contain transition-all',
              imageExpanded ? 'max-h-none' : 'max-h-72 md:max-h-96',
            )}
            onClick={() => setImageExpanded((e) => !e)}
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {imageExpanded ? 'Tap to collapse' : 'Tap image to view full size'}
        </p>
      </div>
    )
  }

  if (hasStructured && trainingSchedule) {
    return (
      <div className={className}>
        <TrainingSchedule trainingSchedule={trainingSchedule} />
      </div>
    )
  }

  return null
}
