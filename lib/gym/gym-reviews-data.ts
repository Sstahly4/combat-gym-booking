import type { Review } from '@/lib/types/database'

export type GymReview = Review & { booking: { user_id: string } | null }
