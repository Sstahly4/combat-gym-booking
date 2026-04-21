import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Invalidate the ISR cache for gym detail pages.
 *
 * Call after any server-side write that changes what the public `/gyms/[id]`
 * page would render (pricing, images, amenities, status flips, etc.). The tag
 * matches the `tags: ['gyms']` we attach inside `unstable_cache` in
 * `app/gyms/[id]/page.tsx`, and the path revalidation forces the ISR HTML for
 * that specific gym to be regenerated on the next request instead of waiting
 * for the 1-hour revalidate window.
 *
 * Safe to call even if the cache entry doesn't exist — Next.js just no-ops.
 */
export function revalidateGymCache(id?: string | null) {
  try {
    revalidateTag('gyms')
    if (id) revalidatePath(`/gyms/${id}`)
  } catch (err) {
    // revalidate* can throw outside of a request context (e.g. during a
    // migration script). Never let that break the actual write.
    console.error('revalidateGymCache failed:', err)
  }
}
