import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const BRAND = '#003580'

const steps = [
  { label: 'Your selection' },
  { label: 'Your details' },
  { label: 'Finish booking' },
]

interface BookingProgressBarProps {
  /** 1-based index of the currently active step */
  currentStep: 1 | 2 | 3
  loading?: boolean
}

function StepCircle({
  stepNumber,
  isCompleted,
  isActive,
}: {
  stepNumber: number
  isCompleted: boolean
  isActive: boolean
}) {
  const isFuture = !isCompleted && !isActive

  return (
    <div
      className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold leading-none',
        isFuture && 'border border-gray-300 bg-white text-gray-400'
      )}
      style={
        isCompleted || isActive
          ? { backgroundColor: BRAND, color: '#fff' }
          : undefined
      }
      aria-hidden
    >
      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNumber}
    </div>
  )
}

function ProgressSkeleton() {
  return (
    <div className="flex items-center w-full">
      {steps.map((_, i) => (
        <div
          key={i}
          className={cn('flex items-center', i < steps.length - 1 ? 'flex-1' : 'shrink-0')}
        >
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
            <div className="hidden sm:block h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 min-w-4 h-px bg-gray-200 mx-4 animate-pulse" />
          )}
        </div>
      ))}
    </div>
  )
}

export function BookingProgressBar({ currentStep, loading = false }: BookingProgressBarProps) {
  return (
    <nav aria-label="Booking progress" className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-5">
        {loading ? (
          <ProgressSkeleton />
        ) : (
          <ol className="flex items-center w-full list-none m-0 p-0">
            {steps.map((step, i) => {
              const stepNumber = i + 1
              const isCompleted = stepNumber < currentStep
              const isActive = stepNumber === currentStep
              const isFuture = stepNumber > currentStep

              return (
                <li
                  key={step.label}
                  className={cn(
                    'flex items-center',
                    i < steps.length - 1 ? 'flex-1' : 'shrink-0'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <div className="flex items-center gap-2.5 shrink-0">
                    <StepCircle
                      stepNumber={stepNumber}
                      isCompleted={isCompleted}
                      isActive={isActive}
                    />
                    <span
                      className={cn(
                        'hidden sm:inline text-sm font-semibold whitespace-nowrap',
                        isFuture ? 'text-gray-400' : 'text-gray-900'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 min-w-4 h-px bg-gray-200 mx-4" aria-hidden />
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </nav>
  )
}
