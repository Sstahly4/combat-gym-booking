import { createClient } from '@supabase/supabase-js'

/**
 * Cookie-free Supabase client for cacheable, public server reads.
 * Use this inside unstable_cache and other static/ISR data paths.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
