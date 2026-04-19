import { redirect } from 'next/navigation'

type Props = {
  params: { step: string }
  searchParams: Record<string, string | string[] | undefined>
}

export default function OnboardingLegacyStepRedirect({ params, searchParams }: Props) {
  const q = new URLSearchParams()
  q.set('step', params.step)
  const gymId = searchParams.gym_id
  if (typeof gymId === 'string' && gymId) {
    q.set('gym_id', gymId)
  }
  redirect(`/manage/onboarding?${q.toString()}`)
}
