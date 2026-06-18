import { getGymReviews } from '@/lib/gym/gym-listing-data'
import { ReviewsCarousel } from '@/components/reviews-carousel'

export async function GymReviewsCarouselSection({ gymId }: { gymId: string }) {
  const reviews = await getGymReviews(gymId)
  return <ReviewsCarousel reviews={reviews} />
}
