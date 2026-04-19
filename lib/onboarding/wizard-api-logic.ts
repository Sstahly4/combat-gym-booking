export function resolveActiveGymId(input: {
  requestedGymId: string | null
  sessionGymId: string | null
  latestOwnerGymId: string | null
  /**
   * When true, do not fall back to the owner’s most recently created gym. Used for
   * admin “create new listing” so a draft session with no `gym_id` stays blank.
   */
  omitLatestGymFallback?: boolean
}) {
  if (input.omitLatestGymFallback) {
    return input.requestedGymId || input.sessionGymId || null
  }
  return input.requestedGymId || input.sessionGymId || input.latestOwnerGymId || null
}

export function validateWizardStepKey(stepKey: string, allowedStepKeys: string[]) {
  return allowedStepKeys.includes(stepKey)
}

export function buildStepMetadata(base: Record<string, any>, extra?: Record<string, any>) {
  return {
    ...base,
    ...(extra || {}),
  }
}
