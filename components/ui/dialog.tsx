import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  /** Stack above other overlays (e.g. onboarding packages panel at z-[100]). */
  stackClassName?: string
}

const Dialog = ({ open, onOpenChange, children, stackClassName = 'z-[100]' }: DialogProps) => {
  if (!open) return null

  const content = (
    <div className={cn('fixed inset-0 flex items-center justify-center p-4', stackClassName)}>
      <div
        className={cn('fixed inset-0 bg-black/50', stackClassName)}
        onClick={() => onOpenChange?.(false)}
        aria-hidden
      />
      <div className={cn('relative', stackClassName)}>{children}</div>
    </div>
  )

  if (typeof document !== "undefined") {
    return createPortal(content, document.body)
  }
  return content
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative bg-background rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto",
      className
    )}
    {...props}
  />
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }
