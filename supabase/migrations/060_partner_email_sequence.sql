-- Partner onboarding lifecycle emails (welcome → checklist → nudge).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_welcome_email_sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS partner_checklist_email_sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS partner_nudge_email_sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS partner_email_sequence_anchor_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.partner_welcome_email_sent_at IS
  'When the transactional partner welcome email was sent (claim complete or first email-verified session).';
COMMENT ON COLUMN public.profiles.partner_checklist_email_sent_at IS
  'When the dynamic go-live checklist email was sent.';
COMMENT ON COLUMN public.profiles.partner_nudge_email_sent_at IS
  'When the day-3 style nudge was sent for partners still not live.';
COMMENT ON COLUMN public.profiles.partner_email_sequence_anchor_at IS
  'First moment the partner entered the sequence (used for relative timing of checklist + nudge).';
