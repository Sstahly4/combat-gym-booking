import { redirect } from 'next/navigation'

type Props = { searchParams: Promise<{ gym_id?: string }> }

/** Legacy URL — keep bookmarks working by opening inline preview in the listing editor. */
export default async function ManageGymPreviewPage({ searchParams }: Props) {
  const { gym_id: gymId } = await searchParams
  if (gymId) {
    redirect(`/manage/gym/edit?id=${encodeURIComponent(gymId)}&section=preview`)
  }
  redirect('/manage/gym/edit?section=preview')
}
