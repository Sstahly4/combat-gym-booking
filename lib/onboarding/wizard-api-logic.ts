export function resolveActiveGymId(input: {
  requestedGymId: string | null
  sessionGymId: string | null
  latestOwnerGymId: string | null
}) {
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
