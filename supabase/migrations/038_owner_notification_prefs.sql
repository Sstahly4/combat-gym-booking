-- Owner portal: persisted email notification toggles (Milestone 4)
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owner_notification_prefs JSONB NOT NULL DEFAULT '{
    "email_bookings": true,
    "email_payouts": true,
    "email_security": true
  }'::jsonb;

COMMENT ON COLUMN public.profiles.owner_notification_prefs IS
  'Owner email notification toggles: email_bookings, email_payouts, email_security (booleans).';

COMMIT;
