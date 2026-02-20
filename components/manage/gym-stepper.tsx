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
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.number)}
                  className={`flex items-center gap-2 ${
                    step.number <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                  disabled={!onStepClick || step.number > currentStep}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step.number < currentStep
                        ? 'bg-[#003580] text-white'
                        : step.number === currentStep
                        ? 'bg-[#003580] text-white ring-2 ring-[#003580] ring-offset-2'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      step.number <= currentStep ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    step.number < currentStep ? 'bg-[#003580]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
