-- Account holder / listing accountability (owner profile, distinct from gym contact)
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legal_first_name TEXT,
  ADD COLUMN IF NOT EXISTS legal_last_name TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_phone TEXT,
  ADD COLUMN IF NOT EXISTS role_at_property TEXT
    CHECK (
      role_at_property IS NULL
      OR role_at_property IN ('owner', 'manager', 'authorised_operator')
    ),
  ADD COLUMN IF NOT EXISTS country_of_residence TEXT;

COMMENT ON COLUMN public.profiles.legal_first_name IS 'Legal first name of the account holder (listing accountability)';
COMMENT ON COLUMN public.profiles.legal_last_name IS 'Legal last name of the account holder';
COMMENT ON COLUMN public.profiles.account_holder_phone IS 'Direct mobile for the account holder (not gym front desk)';
COMMENT ON COLUMN public.profiles.role_at_property IS 'Role at the property: owner, manager, or authorised_operator';
COMMENT ON COLUMN public.profiles.country_of_residence IS 'Country of residence (display name, e.g. Australia)';

COMMIT;
