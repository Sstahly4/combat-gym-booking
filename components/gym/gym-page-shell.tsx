import { cn } from '@/lib/utils'

/** Keeps gym detail routes at full viewport height so the footer cannot collapse during loads. */
export function GymPageMinHeightShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-screen flex-1 flex-col bg-white', className)}>
      {children}
    </div>
  )
}
