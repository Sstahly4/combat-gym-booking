'use client'

import { PackageManager } from './package-manager'

interface PackagesSectionProps {
  gymId: string
  currency: string
  isAdmin?: boolean
}

/**
 * PackagesSection - Thin wrapper around PackageManager
 * 
 * Uses the original PackageManager flow:
 * 1. Create a package (Training Only / Training+Stay / All Inclusive)
 * 2. Set base prices (day/week/month) directly on the package
 * 3. Add room variants with their own prices directly to the package
 * 
 * Room variants ARE the accommodation options — no separate accommodation 
 * manager needed. Each variant (e.g. "Single Fan Room", "Private AC Room") 
 * has its own day/week/month prices that represent the complete price for 
 * that package+room combo.
 */
export function PackagesSection({ gymId, currency, isAdmin = false }: PackagesSectionProps) {
  return <PackageManager gymId={gymId} currency={currency} />
}
