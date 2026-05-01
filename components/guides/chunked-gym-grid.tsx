import type { ReactNode } from 'react'
import type { GuideGym } from '@/lib/guides/thailand-gyms'
import { GuideGymCard } from '@/components/guides/guide-gym-card'

const DEFAULT_CHUNK = 5

export type RankEyebrowVariant = 'default' | 'national' | 'local'

function rankEyebrowText(
  start: number,
  end: number,
  variant: RankEyebrowVariant,
  localityName?: string
) {
  const range = `${start}–${end}`
  if (variant === 'national') return `National ranks ${range}`
  if (variant === 'local') return `${localityName ?? 'Local'} ranks ${range}`
  return `Ranks ${range}`
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

export function ChunkedGymGrid({
  gyms,
  chunkSize = DEFAULT_CHUNK,
  fallbackImageSrc,
  editorialBetweenChunks,
  priorityFirstN = 2,
  rankEyebrow = 'default',
  localityName,
  /** When this grid continues a longer list (e.g. ranks 26+ after a “top 25” section), set to the zero-based index of the first gym in `gyms` in the overall ranking. */
  rankStartOffset = 0,
}: {
  gyms: GuideGym[]
  chunkSize?: number
  fallbackImageSrc?: string
  editorialBetweenChunks: Array<{ title: string; body: ReactNode }>
  priorityFirstN?: number
  rankEyebrow?: RankEyebrowVariant
  localityName?: string
  rankStartOffset?: number
}) {
  const chunks = chunkArray(gyms, chunkSize)

  return (
    <div>
      {chunks.map((chunk, chunkIndex) => {
        const globalStart = rankStartOffset + chunkIndex * chunkSize
        const editorial = editorialBetweenChunks[chunkIndex]
        return (
          <div key={chunkIndex} className="mb-16 last:mb-0">
            <div className="mb-6 flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">
                  {rankEyebrowText(globalStart + 1, globalStart + chunk.length, rankEyebrow, localityName)}
                </p>
                {editorial && <h3 className="mt-1 text-xl font-bold text-gray-900">{editorial.title}</h3>}
              </div>
            </div>
            {editorial && (
              <div className="mb-8 max-w-4xl space-y-3 text-base leading-relaxed text-gray-800">{editorial.body}</div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {chunk.map((gym, i) => {
                const globalIdx = globalStart + i
                return (
                  <GuideGymCard
                    key={gym.id}
                    gym={gym}
                    rank={globalIdx + 1}
                    priorityImage={globalIdx < priorityFirstN}
                    fallbackImageSrc={fallbackImageSrc}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
