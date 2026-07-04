import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  FLAGSHIP_MUAY_THAI_GUIDE,
  getMuayThaiGuideContextForGym,
} from '@/lib/guides/gym-guide-links'

export async function GymTrainingGuidesCallout({
  gymId,
  country,
  city,
  disciplines,
}: {
  gymId: string
  country?: string | null
  city?: string | null
  disciplines?: string[] | null
}) {
  const ctx = await getMuayThaiGuideContextForGym(gymId, { country, city, disciplines })
  if (!ctx) return null

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#003580]" aria-hidden />
          <h3 className="font-bold text-sm md:text-base text-gray-900">Training guides</h3>
        </div>
        {ctx.nationalRank != null && (
          <p className="mb-3 text-xs md:text-sm text-gray-600">
            Ranked #{ctx.nationalRank} of {ctx.totalRanked} Muay Thai camps in Thailand on CombatStay.
          </p>
        )}
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href={FLAGSHIP_MUAY_THAI_GUIDE.href}
              className="font-medium text-[#003580] underline underline-offset-2 hover:text-[#00224d]"
            >
              {FLAGSHIP_MUAY_THAI_GUIDE.label}
            </Link>
          </li>
          {ctx.cityGuideHref && ctx.city && (
            <li>
              <Link
                href={ctx.cityGuideHref}
                className="font-medium text-[#003580] underline underline-offset-2 hover:text-[#00224d]"
              >
                Best Muay Thai gyms in {ctx.city}
              </Link>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
