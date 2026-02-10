'use client'

export function ReviewsLinkButton() {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-[#003580] font-medium hover:underline w-full text-left"
    >
      Read all reviews →
    </button>
  )
}
