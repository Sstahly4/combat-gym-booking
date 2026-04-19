import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Forward pathname+search so server layouts can whitelist paths and preserve return URLs.
  // (Nothing else in the app was setting `next-url`, which broke manage/layout.tsx.)
  const nextUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-next-url', nextUrl)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          // Next.js `request.cookies.set` only accepts (name, value); response gets full options.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          const refreshedHeaders = new Headers(request.headers)
          refreshedHeaders.set('x-next-url', nextUrl)
          response = NextResponse.next({
            request: {
              headers: refreshedHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed (no redirects - handled client-side to prevent loops)
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
