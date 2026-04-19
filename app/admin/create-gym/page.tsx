import type { Metadata } from 'next'
import { OwnerOnboardingWizard } from '@/components/manage/owner-onboarding-wizard'

export const metadata: Metadata = {
  title: 'Create gym | Admin',
}

export default function AdminCreateGymPage() {
  return <OwnerOnboardingWizard embedInAdmin />
}
