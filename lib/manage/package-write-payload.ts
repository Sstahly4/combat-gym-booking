/**
 * Strip legacy package columns before Supabase insert/update.
 * (e.g. packages.daily_capacity from the reverted drop-in type)
 */
export function sanitizePackageWritePayload<T extends Record<string, unknown>>(payload: T): T {
  const { daily_capacity: _removed, ...rest } = payload as T & { daily_capacity?: unknown }
  return rest as T
}
