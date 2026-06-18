import { FeaturedCarousel } from '@/components/featured-carousel'
import type { HomepageGym } from '@/lib/homepage/homepage-rows'

/** Mobile Popular row — gyms fetched in the static page shell (no Suspense) for LCP. */
export function HomepageMobilePopularFast({ gyms }: { gyms: HomepageGym[] }) {
  if (gyms.length === 0) return null

  return (
    <section className="md:hidden pt-4 pb-4 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Popular Training Camps</h2>
        <p className="text-sm text-gray-700 mb-3">
          From intensive fight camps to holistic training retreats, find your perfect match
        </p>
        <FeaturedCarousel gyms={gyms} priorityCount={2} eagerCount={4} />
      </div>
    </section>
  )
}
