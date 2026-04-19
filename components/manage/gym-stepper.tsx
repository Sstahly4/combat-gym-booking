'use client'

import { Check } from 'lucide-react'

interface Step {
  id: string
  label: string
  number: number
}

interface GymStepperProps {
  currentStep: number
  steps: Step[]
  onStepClick?: (step: number) => void
}

export function GymStepper({ currentStep, steps, onStepClick }: GymStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1 sm:gap-2 py-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onStepClick?.(step.number)}
                className={`flex items-center gap-1.5 sm:gap-2 min-w-0 ${
                  step.number <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
                disabled={!onStepClick || step.number > currentStep}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors ${
                    step.number < currentStep
                      ? 'bg-[#003580] text-white'
                      : step.number === currentStep
                        ? 'bg-[#003580] text-white ring-2 ring-[#003580] ring-offset-2'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.number < currentStep ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-sm font-medium truncate hidden sm:block ${
                    step.number <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 min-w-[0.5rem] mx-1 sm:mx-2 transition-colors ${
                  step.number < currentStep ? 'bg-[#003580]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
