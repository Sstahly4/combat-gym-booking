'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectUrl?: string
}

export function SignInModal({
  open,
  onOpenChange,
  redirectUrl = '/saved',
}: SignInModalProps) {
  const router = useRouter()

  const handleContinueWithGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}` },
    })
    onOpenChange(false)
  }

  const handleContinueWithEmail = () => {
    onOpenChange(false)
    router.push(`/auth/signin?redirect=${encodeURIComponent(redirectUrl)}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[480px] rounded-2xl border-0 bg-white p-0 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-10 pb-10 sm:px-10 sm:pt-12 sm:pb-12 flex flex-col">
          {/* Header: brand + close */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <span className="text-sm font-bold text-[#003580] tracking-tight">
              CombatBooking.com
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl font-semibold leading-snug tracking-tight text-gray-900 mb-6 sm:mb-8">
            Saving this gym? Sign in to keep your saved gyms in one place and never lose a gym again.
          </h2>

          {/* Sign-in options */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleContinueWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="relative py-2">
              <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gray-200" />
              <span className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">or</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleContinueWithEmail}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <Mail className="h-5 w-5 flex-shrink-0 text-gray-600" />
              Continue with email
            </button>
          </div>

          {/* Fine print — centre aligned */}
          <div className="mt-10 sm:mt-12 pt-6 space-y-3 text-center">
            <p className="text-[11px] text-gray-400 leading-relaxed max-w-[360px] mx-auto">
              By proceeding, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-gray-600">Terms of Use</Link>
              {' '}and confirm you have read our{' '}
              <Link href="/privacy" className="underline hover:text-gray-600">Privacy and Cookie Statement</Link>.
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed max-w-[360px] mx-auto">
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Privacy Policy</a>
              {' '}and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Terms of Service</a>
              {' '}apply.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
