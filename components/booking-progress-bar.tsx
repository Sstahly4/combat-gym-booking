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

export function BookingProgressBar({ currentStep, loading = false }: BookingProgressBarProps) {
  if (loading) {
    return (
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            {steps.map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-10 h-0.5 bg-gray-200 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          {steps.map((step, i) => {
            const stepNumber = i + 1
            const isCompleted = stepNumber < currentStep
            const isActive = stepNumber === currentStep

            const connectorActive = stepNumber < currentStep

            return (
              <div key={i} className="flex items-center gap-3">
                {/* Step */}
                <div className="flex items-center gap-2">
                  {/* Circle */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold leading-none"
                    style={{
                      backgroundColor: isCompleted || isActive ? BRAND : '#d1d5db',
                      color: isCompleted || isActive ? '#fff' : '#6b7280',
                    }}
                  >
                    {isCompleted ? '✓' : stepNumber}
                  </div>

                  {/* Label */}
                  <span
                    className="text-sm font-medium whitespace-nowrap"
                    style={{
                      color: isActive ? BRAND : isCompleted ? '#374151' : '#9ca3af',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector (not after last step) */}
                {i < steps.length - 1 && (
                  <div
                    className="w-10 h-0.5 shrink-0"
                    style={{ backgroundColor: connectorActive ? BRAND : '#d1d5db' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
