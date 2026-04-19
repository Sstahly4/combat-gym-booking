import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStepMetadata, resolveActiveGymId, validateWizardStepKey } from '@/lib/onboarding/wizard-api-logic'

test('wizard state: resolveActiveGymId prefers requested gym', () => {
  const result = resolveActiveGymId({
    requestedGymId: 'gym-requested',
    sessionGymId: 'gym-session',
    latestOwnerGymId: 'gym-latest',
  })
  assert.equal(result, 'gym-requested')
})

test('wizard state: resolveActiveGymId falls back to session gym', () => {
  const result = resolveActiveGymId({
    requestedGymId: null,
    sessionGymId: 'gym-session',
    latestOwnerGymId: 'gym-latest',
  })
  assert.equal(result, 'gym-session')
})

test('wizard step: validateWizardStepKey allows known keys', () => {
  const allowed = ['basics', 'packages', 'photos', 'finalize']
  assert.equal(validateWizardStepKey('packages', allowed), true)
  assert.equal(validateWizardStepKey('unknown', allowed), false)
})

test('wizard step: buildStepMetadata merges endpoint metadata safely', () => {
  const result = buildStepMetadata({ source: 'wizard' }, { gym_id: 'gym-1' })
  assert.deepEqual(result, { source: 'wizard', gym_id: 'gym-1' })
})
