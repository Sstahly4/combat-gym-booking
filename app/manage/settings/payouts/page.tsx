import { redirect } from 'next/navigation'

export default function ManagePayoutSettingsRedirectPage() {
  redirect('/manage/settings?tab=payouts')
}
