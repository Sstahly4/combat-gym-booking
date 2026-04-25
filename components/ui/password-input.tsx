'use client'

/**
 * Password input with a built-in show/hide toggle (eye icon).
 *
 * Same API as <Input /> so it's a drop-in replacement for type="password" fields.
 * The toggle is keyboard-accessible and announces state via aria-pressed/label.
 */

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface PasswordInputProps extends Omit<InputProps, 'type'> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onMouseDown={(e) => {
            // Prevent the input losing focus on click, which could trigger
            // parent re-renders and reset state before onClick fires.
            e.preventDefault()
          }}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 z-10 flex items-center justify-center px-3 text-gray-400 hover:text-gray-600 focus-visible:text-gray-700 focus-visible:outline-none touch-manipulation"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
