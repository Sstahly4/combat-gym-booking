-- Package-level training session access (industry-standard camp terminology).

ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS training_access text;

ALTER TABLE public.packages DROP CONSTRAINT IF EXISTS packages_training_access_check;

ALTER TABLE public.packages
ADD CONSTRAINT packages_training_access_check
CHECK (
  training_access IS NULL
  OR training_access IN ('twice_daily', 'once_daily', 'flexible_daily')
);

COMMENT ON COLUMN public.packages.training_access IS
  'Training sessions per day: twice_daily (Full Access), once_daily (Lite Access), flexible_daily (choose morning or evening).';

UPDATE public.packages
SET training_access = 'twice_daily'
WHERE training_access IS NULL
  AND offer_type IN (
    'TYPE_TRAINING_ONLY',
    'TYPE_TRAINING_ACCOM',
    'TYPE_ALL_INCLUSIVE',
    'TYPE_CUSTOM_EXP'
  );
