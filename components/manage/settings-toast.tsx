'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

export type SettingsToastTone = 'success' | 'error'

type ToastEntry = {
  id: number
  message: string
  tone: SettingsToastTone
}

type SettingsToastContextValue = {
  showToast: (message: string, tone?: SettingsToastTone) => void
  /** Register that a tab has dirty (unsaved) changes. */
  setDirty: (key: string, dirty: boolean) => void
  /** Whether any tab has dirty changes. */
  hasDirty: boolean
  /** Ask before leaving a dirty tab. Returns true when OK to proceed. */
  confirmDiscardIfDirty: (key: string) => boolean
}

const SettingsToastContext = createContext<SettingsToastContextValue | null>(null)

export function SettingsToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const idRef = useRef(0)
  const [dirty, setDirtyState] = useState<Record<string, boolean>>({})

  const showToast = useCallback((message: string, tone: SettingsToastTone = 'success') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const setDirty = useCallback((key: string, isDirty: boolean) => {
    setDirtyState((prev) => {
      if (prev[key] === isDirty) return prev
      const next = { ...prev }
      if (isDirty) next[key] = true
      else delete next[key]
      return next
    })
  }, [])

  const hasDirty = useMemo(() => Object.keys(dirty).length > 0, [dirty])

  const confirmDiscardIfDirty = useCallback(
    (key: string) => {
      if (!dirty[key]) return true
      const ok = window.confirm('You have unsaved changes in this section. Leave anyway?')
      if (ok) {
        setDirtyState((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }
      return ok
    },
    [dirty]
  )

  useEffect(() => {
    if (!hasDirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasDirty])

  const value = useMemo(
    () => ({ showToast, setDirty, hasDirty, confirmDiscardIfDirty }),
    [showToast, setDirty, hasDirty, confirmDiscardIfDirty]
  )

  return (
    <SettingsToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ring-1 ring-black/5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              toast.tone === 'success'
                ? 'border-emerald-200 bg-white text-emerald-900'
                : 'border-red-200 bg-white text-red-900'
            }`}
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" strokeWidth={1.75} aria-hidden />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" strokeWidth={1.75} aria-hidden />
            )}
            <p className="flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </SettingsToastContext.Provider>
  )
}

export function useSettingsToast(): SettingsToastContextValue {
  const ctx = useContext(SettingsToastContext)
  if (!ctx) {
    throw new Error('useSettingsToast must be used inside SettingsToastProvider')
  }
  return ctx
}
