'use client'

import { ManagePayoutsWorkspace } from '@/components/manage/manage-payouts-workspace'

export function SettingsPayoutsSection() {
  return (
    <div
      id="settings-payouts-section"
      data-claim-tour="tour-settings-payouts"
      className="space-y-6"
    >
      <ManagePayoutsWorkspace />
    </div>
  )
}
