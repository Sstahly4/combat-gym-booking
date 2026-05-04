-- Ops-friendly snapshot of what the owner submitted for Wise pay-to-email recipients.
-- Not bank credentials; used for manual payout entry and support. Source of truth for routing remains Wise recipient id.

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS wise_recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS wise_recipient_account_holder_name TEXT;

COMMENT ON COLUMN public.gyms.wise_recipient_email IS 'Email used for Wise pay-to-email recipient (ops / support; same as sent to Wise API)';
COMMENT ON COLUMN public.gyms.wise_recipient_account_holder_name IS 'Legal or business name submitted with Wise recipient (ops / support)';
