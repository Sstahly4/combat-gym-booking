'use client'

import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'

export type PartnerHubDropdownAlign = 'left' | 'right' | 'center'

function useDropdownPortalPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  align: PartnerHubDropdownAlign,
) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' })

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return

    const update = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return

      const gap = 6
      const top = rect.bottom + gap
      const base: CSSProperties = {
        position: 'fixed',
        top,
        zIndex: 200,
        visibility: 'visible',
      }

      if (align === 'right') {
        setStyle({ ...base, right: Math.max(8, window.innerWidth - rect.right) })
        return
      }

      if (align === 'center') {
        setStyle({
          ...base,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)',
        })
        return
      }

      setStyle({ ...base, left: Math.max(8, rect.left) })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, align, anchorRef])

  return style
}

/** Renders partner hub header menus in a body portal so listing workspace stacking cannot swallow clicks. */
export function PartnerHubDropdownPortal({
  open,
  anchorRef,
  panelRef,
  align,
  className,
  children,
  role = 'menu',
}: {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  panelRef: RefObject<HTMLDivElement | null>
  align: PartnerHubDropdownAlign
  className?: string
  children: ReactNode
  role?: string
}) {
  const [mounted, setMounted] = useState(false)
  const style = useDropdownPortalPosition(open, anchorRef, align)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open || !mounted) return null

  return createPortal(
    <div ref={panelRef as React.RefObject<HTMLDivElement>} role={role} style={style} className={className}>
      {children}
    </div>,
    document.body,
  )
}
