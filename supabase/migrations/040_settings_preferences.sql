-- Settings page: personal preferences + facility/gym operational fields + extended notification prefs
BEGIN;  

-- Personal / account holder preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT,
  ADD COLUMN IF NOT EXISTS backup_email TEXT;

COMMENT ON COLUMN public.profiles.preferred_language IS
  'BCP-47 language tag for UI / email localization (e.g. en, en-AU, th, pt-BR)';
COMMENT ON COLUMN public.profiles.backup_email IS
  'Secondary contact email for account recovery; does not replace auth email';

-- Extend notification prefs (keep backward-compatible defaults)
ALTER TABLE public.profiles
  ALTER COLUMN owner_notification_prefs
    SET DEFAULT '{
      "email_bookings": true,
      "email_cancellations": true,
      "email_payouts": true,
      "email_security": true,
      "email_marketing": false
    }'::jsonb;

UPDATE public.profiles
   SET owner_notification_prefs = owner_notification_prefs
     || jsonb_build_object(
          'email_cancellations', COALESCE(owner_notification_prefs->'email_cancellations', 'true'::jsonb),
          'email_marketing',     COALESCE(owner_notification_prefs->'email_marketing',     'false'::jsonb)
        )
 WHERE owner_notification_prefs IS NOT NULL;

-- Gym / facility operational fields (distinct from the account holder)
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS public_contact_phone TEXT;

COMMENT ON COLUMN public.gyms.timezone IS
  'IANA timezone name for the facility (e.g. Asia/Bangkok). Used for schedule rendering and reports.';
COMMENT ON COLUMN public.gyms.public_contact_phone IS
  'Public reception / front-desk phone shown on listing; separate from account holder phone';

COMMIT;
