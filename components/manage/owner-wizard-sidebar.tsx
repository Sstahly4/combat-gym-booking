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

/**
 * Minimal vertical stepper rail used in the partner onboarding wizard.
 * Airbnb / Stripe-style: a single thin guide line, small dots, quiet type, no chunky chrome.
 */
export function OwnerWizardSidebar({
  steps,
  currentIndex,
  completedKeys,
  onStepClick,
}: OwnerWizardSidebarProps) {
  const canNavigate = Boolean(onStepClick)

  return (
    <nav className="w-full" aria-label="Onboarding progress">
      <p className="mb-4 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
        Listing setup
      </p>
      <ol className="relative">
        {steps.map((step, i) => {
          const complete = completedKeys.includes(step.key)
          const current = step.index === currentIndex
          const isLast = i === steps.length - 1

          return (
            <li key={step.key} className="relative">
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-[11px] top-7 h-[calc(100%-12px)] w-px',
                    complete ? 'bg-[#003580]/60' : 'bg-gray-200'
                  )}
                />
              ) : null}

              <button
                type="button"
                disabled={!canNavigate}
                onClick={() => onStepClick?.(step.index)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'group flex w-full items-start gap-3 rounded-md pl-1 pr-2 text-left transition-colors',
                  /** Comfortable taps on phones; lg+ sidebar keeps tighter vertical rhythm */
                  'min-h-11 py-3 lg:min-h-0 lg:py-2',
                  canNavigate && 'hover:bg-gray-50 active:bg-gray-50/80 lg:active:bg-transparent',
                  !canNavigate && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                    complete && 'bg-[#003580] text-white ring-2 ring-white',
                    !complete && current && 'bg-white text-[#003580] ring-2 ring-[#003580]',
                    !complete &&
                      !current &&
                      'bg-white text-gray-400 ring-2 ring-gray-200 group-hover:ring-[#003580]/30 group-hover:text-gray-600'
                  )}
                >
                  {complete ? (
                    <Check className="h-3 w-3 stroke-[3]" aria-hidden />
                  ) : (
                    step.index
                  )}
                </span>

                <span className="min-w-0 flex-1 pt-px">
                  <span
                    className={cn(
                      'block text-[13.5px] leading-tight transition-colors',
                      current && 'font-semibold text-gray-900',
                      !current && complete && 'font-medium text-gray-700',
                      !current && !complete && 'text-gray-500 group-hover:text-gray-700'
                    )}
                  >
                    {step.label}
                  </span>
                  {complete && !current ? (
                    <span className="mt-0.5 block text-[11.5px] font-medium text-[#003580]">
                      Completed
                    </span>
                  ) : null}
                  {current ? (
                    <span className="mt-0.5 block text-[11.5px] font-medium text-gray-500">
                      In progress
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
