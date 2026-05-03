import { randomUUID } from 'node:crypto'
import { wiseFetchJson } from '@/lib/wise/wise-http'

export type WiseCreateEmailRecipientResult = {
  id: number
  active?: boolean
}

/**
 * Create a Wise email recipient (pay to another Wise user by email).
 * @see https://docs.wise.com/api-reference/recipient
 */
export async function wiseCreateEmailRecipient(params: {
  profileId: number
  currency: string
  accountHolderName: string
  email: string
}): Promise<WiseCreateEmailRecipientResult> {
  const idempotenceKey = randomUUID()
  return wiseFetchJson<WiseCreateEmailRecipientResult>('/v1/accounts', {
    method: 'POST',
    idempotenceKey,
    body: JSON.stringify({
      currency: params.currency.toUpperCase(),
      type: 'email',
      profile: params.profileId,
      accountHolderName: params.accountHolderName.trim(),
      ownedByCustomer: false,
      details: {
        email: params.email.trim().toLowerCase(),
      },
    }),
  })
}
