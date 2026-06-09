import type { User } from '@supabase/supabase-js'
import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

/** Best-effort lookup by email via the admin Auth API (paginated). */
export async function findAuthUserByEmail(
  admin: AdminClient,
  email: string
): Promise<User | null> {
  const normalized = email.toLowerCase().trim()
  if (!normalized) return null

  let page = 1
  const perPage = 200

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const users = data?.users ?? []
    const match = users.find((u) => (u.email ?? '').toLowerCase() === normalized)
    if (match) return match

    if (users.length < perPage) break
    page++
  }

  return null
}
