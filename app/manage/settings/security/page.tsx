import { redirect } from 'next/navigation'

/** Canonical settings URL uses a single page + `?tab=` for smooth client navigation. */
export default function ManageSecuritySettingsRedirectPage() {
  redirect('/manage/settings?tab=security')
}
