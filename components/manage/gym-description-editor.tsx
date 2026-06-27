'use client'

import { useRef, type ChangeEvent } from 'react'
import { Bold, Heading2, Italic } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { GymDescriptionField } from '@/components/manage/gym-description-field'
import { wrapTextareaSelection } from '@/lib/text/wrap-textarea-selection'
import { cn } from '@/lib/utils'

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

export function GymDescriptionEditor({
  id = 'description',
  name = 'description',
  value,
  onChange,
  required,
  className,
}: {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const applyWrap = (wrapper: string) => {
    const el = textareaRef.current
    if (!el) return
    const { value: next, selectionStart, selectionEnd } = wrapTextareaSelection(el, wrapper)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="mb-3">
        <Label htmlFor={id} className="text-base font-semibold text-gray-900">
          Description
        </Label>
        <p className="mt-1 text-sm text-gray-500">
          Tell guests what training here feels like. Use the toolbar or keyboard — formatting shows on your public
          listing.
        </p>
      </div>

      <div className="flex min-h-[min(70vh,42rem)] flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.03]">
        <div className="flex items-center gap-0.5 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5">
          <ToolbarButton label="Bold" onClick={() => applyWrap('**')}>
            <Bold className="h-4 w-4" strokeWidth={2} aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => applyWrap('_')}>
            <Italic className="h-4 w-4" strokeWidth={2} aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Section heading" onClick={() => applyWrap('**')}>
            <Heading2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          </ToolbarButton>
          <span className="ml-2 hidden text-xs text-gray-400 sm:inline">
            Blank line = new paragraph · Paste from Docs supported
          </span>
        </div>

        <GymDescriptionField
          ref={textareaRef}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          required={required}
          rows={16}
          placeholder="Describe your gym, coaches, facilities, and what makes a stay here worthwhile..."
          className="min-h-0 flex-1 resize-none rounded-none border-0 bg-white px-4 py-4 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  )
}
