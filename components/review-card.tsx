'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import type { Review } from '@/lib/types/database'

interface ReviewCardProps {
  review: Review & { booking?: { user_id: string } | null }
}

// Helper function to format review date as "time ago"
function formatReviewDate(createdAt: string): string {
  const reviewDate = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - reviewDate.getTime())
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))
  const diffYears = Math.floor(diffMonths / 12)
  
  if (diffYears > 0) {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`
  } else if (diffMonths > 0) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
  } else {
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    } else {
      return 'Today'
    }
  }
}

// Helper component to render star rating (Booking.com style)
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-[#febb02] text-[#febb02]'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export function ReviewCard({ review, compact = false }: ReviewCardProps & { compact?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = review.comment && review.comment.length > 200

  if (compact) {
    // Compact card for carousel (3 per row) - wider than tall
    return (
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        <CardContent className="p-5 flex flex-col min-h-[240px]">
          <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#003580] to-[#004a9e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {review.reviewer_name 
                ? review.reviewer_name.charAt(0).toUpperCase() 
                : (review.booking?.user_id ? review.booking.user_id.charAt(0).toUpperCase() : 'G')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {review.reviewer_name || 'Verified Guest'}
              </p>
              <p className="text-xs text-gray-500">
                {review.created_at 
                  ? formatReviewDate(review.created_at)
                  : 'Recent stay'}
              </p>
            </div>
          </div>
          <div className="mb-3 flex-shrink-0">
            <StarRating rating={review.rating} />
          </div>
          {review.comment && (
            <div className="text-gray-700 text-sm leading-relaxed flex flex-col">
              <p className={isExpanded ? '' : 'line-clamp-4'}>
                {review.comment}
              </p>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[#003580] font-medium text-sm mt-2 hover:underline text-left flex-shrink-0"
                >
                  {isExpanded ? 'See less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full-width card for vertical list
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003580] to-[#004a9e] flex items-center justify-center text-white font-bold text-sm">
              {review.reviewer_name 
                ? review.reviewer_name.charAt(0).toUpperCase() 
                : (review.booking?.user_id ? review.booking.user_id.charAt(0).toUpperCase() : 'G')}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {review.reviewer_name || 'Verified Guest'}
              </p>
              <p className="text-xs text-gray-500">
                {review.created_at 
                  ? formatReviewDate(review.created_at)
                  : 'Recent stay'}
              </p>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>
        {review.comment && (
          <div className="text-gray-700 text-[15px] leading-relaxed">
            <p className={isExpanded ? '' : 'line-clamp-3'}>
              {review.comment}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 font-medium text-sm mt-1 hover:underline"
              >
                {isExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
