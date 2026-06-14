-- Affiliate lifecycle emails (welcome on setup, tips follow-up via cron).

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tips_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_sequence_anchor_at TIMESTAMPTZ;

COMMENT ON COLUMN public.affiliates.welcome_email_sent_at IS
  'When the post-setup welcome email was sent.';
COMMENT ON COLUMN public.affiliates.tips_email_sent_at IS
  'When the promoter tips follow-up email was sent (~36h after welcome).';
COMMENT ON COLUMN public.affiliates.email_sequence_anchor_at IS
  'Anchor timestamp for delayed affiliate lifecycle emails.';
