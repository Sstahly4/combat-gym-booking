'use client'

import { useCallback, useEffect, useRef, type ClipboardEvent } from 'react'
import { Bold, Heading2, Italic } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  gymDescriptionElementToMarkdown,
  gymDescriptionMarkdownToHtml,
} from '@/lib/text/gym-description-editable'
import { structuredTextFromClipboard } from '@/lib/text/rich-paste'
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
  const editorRef = useRef<HTMLDivElement>(null)
  const lastSyncedValue = useRef(value)
  const isInternalChange = useRef(false)
  const hasInitialized = useRef(false)

  const syncFromEditor = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const markdown = gymDescriptionElementToMarkdown(el)
    isInternalChange.current = true
    lastSyncedValue.current = markdown
    onChange(markdown)
  }, [onChange])

  const syncToEditor = useCallback((markdown: string) => {
    const el = editorRef.current
    if (!el) return
    el.innerHTML = gymDescriptionMarkdownToHtml(markdown)
    lastSyncedValue.current = markdown
  }, [])

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      syncToEditor(value)
      return
    }
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    if (value !== lastSyncedValue.current) {
      syncToEditor(value)
    }
  }, [value, syncToEditor])

  const applyFormat = (command: 'bold' | 'italic') => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    document.execCommand(command, false)
    syncFromEditor()
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const html = event.clipboardData.getData('text/html')
    const plain = event.clipboardData.getData('text/plain')
    if (!html.trim() && !plain.trim()) return

    const structured = structuredTextFromClipboard(html, plain)
    if (!structured) return

    const insertHtml = gymDescriptionMarkdownToHtml(structured)
    if (insertHtml) {
      document.execCommand('insertHTML', false, insertHtml)
    } else {
      document.execCommand('insertText', false, structured)
    }
    syncFromEditor()
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

      <div className="flex min-h-[min(70vh,42rem)] flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-900/[0.04] ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-0.5 border-b border-gray-100 bg-gray-50/80 px-2 py-1.5">
          <ToolbarButton label="Bold" onClick={() => applyFormat('bold')}>
            <Bold className="h-4 w-4" strokeWidth={2} aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => applyFormat('italic')}>
            <Italic className="h-4 w-4" strokeWidth={2} aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Section heading" onClick={() => applyFormat('bold')}>
            <Heading2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          </ToolbarButton>
          <span className="ml-2 hidden text-xs text-gray-400 sm:inline">
            Blank line = new paragraph · Paste from Docs supported
          </span>
        </div>

        <input type="hidden" name={name} value={value} required={required} />

        <div
          ref={editorRef}
          id={id}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromEditor}
          onPaste={handlePaste}
          data-placeholder="Describe your gym, coaches, facilities, and what makes a stay here worthwhile..."
          className={cn(
            'min-h-0 flex-1 overflow-y-auto px-4 py-4 text-[15px] leading-relaxed text-gray-700 outline-none',
            'focus-visible:ring-0',
            '[&_p]:whitespace-pre-wrap [&_p+p]:mt-4',
            '[&_strong]:font-semibold [&_strong]:text-gray-900',
            'empty:before:pointer-events-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]',
          )}
        />
      </div>
    </div>
  )
}
