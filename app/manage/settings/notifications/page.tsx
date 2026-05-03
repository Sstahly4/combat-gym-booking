import { redirect } from 'next/navigation'

export default function ManageNotificationsSettingsRedirectPage() {
  redirect('/manage/settings?tab=communications')
}
