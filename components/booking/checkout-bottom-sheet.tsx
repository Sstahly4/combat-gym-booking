'use client'

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function CheckoutBottomSheet({
  onClose,
  onCancel,
  title,
  primaryLabel,
  onPrimary,
  children,
  layer = 'primary',
}: {
  onClose: () => void
  onCancel: () => void
  title: string
  primaryLabel: 'Next' | 'Done' | 'Save'
  onPrimary: () => void
  children: ReactNode
  /** Nested sheet stacks above the parent sheet (e.g. Add card details) */
  layer?: 'primary' | 'nested'
}) {
  const rootZ = layer === 'nested' ? 'z-[310]' : 'z-[300]'
  const sheetZ = layer === 'nested' ? 'z-[312]' : 'z-[302]'
  const [sheetTranslateY, setSheetTranslateY] = useState(0)
  const sheetStartY = useRef(0)
  const sheetIsDragging = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  const handleSheetTouchStart = (e: TouchEvent) => {
    sheetStartY.current = e.touches[0].clientY
    sheetIsDragging.current = true
  }

  const handleSheetTouchMove = (e: TouchEvent) => {
    if (!sheetIsDragging.current) return
    const diffY = e.touches[0].clientY - sheetStartY.current
    if (diffY > 0) setSheetTranslateY(diffY)
  }

  const handleSheetTouchEnd = () => {
    if (!sheetIsDragging.current) return
    sheetIsDragging.current = false
    if (sheetTranslateY > 100) onClose()
    setSheetTranslateY(0)
  }

  const handleRootClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    onClose()
  }

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const preventBackdropScroll: EventListener = (e) => {
      if (sheetRef.current?.contains(e.target as Node)) return
      e.preventDefault()
    }
    root.addEventListener('touchmove', preventBackdropScroll, { passive: false })
    return () => root.removeEventListener('touchmove', preventBackdropScroll)
  }, [])

  useEffect(() => {
    const handle = dragHandleRef.current
    if (!handle) return
    const preventDragScroll: EventListener = (e) => {
      if (sheetIsDragging.current) e.preventDefault()
    }
    handle.addEventListener('touchmove', preventDragScroll, { passive: false })
    return () => handle.removeEventListener('touchmove', preventDragScroll)
  }, [])

  const sheetDragging = sheetTranslateY > 0

  const sheet = (
    <div
      ref={rootRef}
      className={`md:hidden fixed inset-0 ${rootZ} overscroll-none bg-black/50`}
      role="dialog"
      aria-modal="true"
      onClick={handleRootClick}
    >
      <div
        ref={sheetRef}
        className={`absolute inset-x-0 top-[4%] bottom-0 ${sheetZ} flex flex-col rounded-t-2xl bg-white shadow-2xl overscroll-contain ${
          sheetDragging ? 'transition-transform duration-100 ease-out' : ''
        }`}
        style={sheetDragging ? { transform: `translateY(${sheetTranslateY}px)` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={dragHandleRef}
          className="flex-shrink-0 touch-none"
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
        >
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 px-6 pt-2 pb-5 flex-shrink-0">
          <h2 className="text-[22px] font-semibold leading-tight text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="w-8 h-8 -mr-1 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 px-6 overflow-y-auto">{children}</div>
        <div
          className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 flex-shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-gray-900 py-1.5 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="h-11 px-6 text-sm font-semibold rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return sheet
  return createPortal(sheet, document.body)
}
