import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client using service role key
 * This bypasses RLS and should ONLY be used for admin operations
 * where the caller has already been verified as an admin
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Try both possible environment variable names
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set in .env.local. ' +
      'Please add it from your Supabase dashboard: Settings > API > service_role key (secret)'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
