export const CREATOR_PROGRAM_SUBJECT = 'Creator Program'

export const DATA_DELETION_SUBJECT = 'Data deletion request'

export const PARTNER_SUPPORT_SUBJECT = 'Partner support request'

export const CREATOR_PROGRAM_MESSAGE_PROMPT =
  "Tell us about your audience, channels, and how you'd like to work with CombatStay."

export const CREATOR_PROGRAM_MIN_MESSAGE_LENGTH = 40

export const GENERAL_MIN_MESSAGE_LENGTH = 10

export function isCreatorProgramSubject(subject: string | null | undefined): boolean {
  return subject?.trim() === CREATOR_PROGRAM_SUBJECT
}

export function validateContactMessage(
  message: string,
  options?: { creatorProgram?: boolean }
): string | null {
  const trimmed = message.trim()
  if (!trimmed) {
    return 'Message is required.'
  }

  if (options?.creatorProgram) {
    if (trimmed.length < CREATOR_PROGRAM_MIN_MESSAGE_LENGTH) {
      return 'Please share more about your audience, channels, and how you would like to partner with us.'
    }
    if (
      trimmed.localeCompare(CREATOR_PROGRAM_MESSAGE_PROMPT, undefined, {
        sensitivity: 'accent',
      }) === 0
    ) {
      return 'Please replace the prompt with details about your audience, channels, and partnership goals.'
    }
    return null
  }

  if (trimmed.length < GENERAL_MIN_MESSAGE_LENGTH) {
    return 'Please provide a bit more detail in your message.'
  }

  return null
}
