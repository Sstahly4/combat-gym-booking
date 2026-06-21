'use client'

import { forwardRef, type ChangeEvent, type ClipboardEvent } from 'react'
import { Textarea, type TextareaProps } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { insertTextAtSelection, structuredTextFromClipboard } from '@/lib/text/rich-paste'

export const GymDescriptionField = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function GymDescriptionField({ className, onPaste, onChange, ...props }, ref) {
    const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
      onPaste?.(event)
      if (event.defaultPrevented) return

      const html = event.clipboardData.getData('text/html')
      const plain = event.clipboardData.getData('text/plain')
      if (!html.trim() && !plain.trim()) return

      const structured = structuredTextFromClipboard(html, plain)
      if (!structured) return

      // Always normalize rich/plain clipboard into structured text so spacing survives paste.
      event.preventDefault()
      const next = insertTextAtSelection(event.currentTarget, structured)
      onChange?.({
        ...event,
        target: { ...event.currentTarget, value: next },
        currentTarget: { ...event.currentTarget, value: next },
      } as ChangeEvent<HTMLTextAreaElement>)
    }

    return (
      <Textarea
        ref={ref}
        {...props}
        onChange={onChange}
        onPaste={handlePaste}
        className={cn('min-h-[10rem] font-normal leading-relaxed', className)}
        spellCheck
      />
    )
  },
)
