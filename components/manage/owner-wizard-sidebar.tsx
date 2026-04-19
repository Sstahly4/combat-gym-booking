'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OwnerWizardStepDefinition } from '@/lib/onboarding/owner-wizard'

export interface OwnerWizardSidebarProps {
  steps: OwnerWizardStepDefinition[]
  currentIndex: number
  completedKeys: string[]
  onStepClick?: (stepIndex: number) => void
}

export function OwnerWizardSidebar({
  steps,
  currentIndex,
  completedKeys,
  onStepClick,
}: OwnerWizardSidebarProps) {
  const canNavigate = Boolean(onStepClick)

  return (
    <nav className="w-full" aria-label="Onboarding progress">
      <ul className="space-y-0">
        {steps.map((step, i) => {
          const complete = completedKeys.includes(step.key)
          const current = step.index === currentIndex

          return (
            <li key={step.key}>
              <div className="flex gap-3 py-1">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={!canNavigate}
                    onClick={() => onStepClick?.(step.index)}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      complete && 'bg-[#003580] text-white shadow-sm',
                      !complete &&
                        current &&
                        'border-2 border-[#003580] bg-white text-[#003580]',
                      !complete &&
                        !current &&
                        'border-2 border-gray-200 bg-white text-gray-500 hover:border-[#003580]/40 hover:text-[#003580]'
                    )}
                    aria-current={current ? 'step' : undefined}
                  >
                    {complete ? <Check className="h-4 w-4 stroke-[2.5]" aria-hidden /> : step.index}
                  </button>
                  {i < steps.length - 1 ? (
                    <div className="mt-1 h-7 w-px shrink-0 bg-gray-200" aria-hidden />
                  ) : null}
                </div>
                <div className={cn('min-w-0 flex-1', i < steps.length - 1 && 'pb-1')}>
                  <button
                    type="button"
                    disabled={!canNavigate}
                    onClick={() => onStepClick?.(step.index)}
                    className={cn(
                      'w-full rounded-md text-left text-sm leading-normal transition-colors',
                      current && 'font-semibold text-[#003580]',
                      !current &&
                        complete &&
                        'font-medium text-green-700 hover:bg-gray-50 hover:text-green-800',
                      !current &&
                        !complete &&
                        'text-gray-600 hover:bg-gray-50 hover:text-[#003580]'
                    )}
                  >
                    {step.label}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
