-- Partner platform agreement (electronic acceptance + audit fields).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_agreement_signed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS partner_agreement_ip TEXT NULL,
  ADD COLUMN IF NOT EXISTS partner_agreement_version TEXT NULL,
  ADD COLUMN IF NOT EXISTS partner_agreement_signatory_name TEXT NULL;

COMMENT ON COLUMN public.profiles.partner_agreement_signed_at IS
  'When the partner accepted the current CombatStay partner agreement in Partner Hub.';
COMMENT ON COLUMN public.profiles.partner_agreement_ip IS
  'Client IP observed at acceptance (best-effort from edge headers).';
COMMENT ON COLUMN public.profiles.partner_agreement_version IS
  'Version string of the agreement text accepted; bump when terms change to require re-acceptance.';
COMMENT ON COLUMN public.profiles.partner_agreement_signatory_name IS
  'Legal name typed at signing (should match account / Basic Info for disputes).';
