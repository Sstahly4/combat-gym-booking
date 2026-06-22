-- Revert drop-in package type and per-package daily_capacity (if applied).

UPDATE packages
SET offer_type = 'TYPE_TRAINING_ONLY'
WHERE offer_type = 'TYPE_DROP_IN';

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_daily_capacity_nonneg;

ALTER TABLE packages DROP COLUMN IF EXISTS daily_capacity;

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_offer_type_check;

ALTER TABLE packages
ADD CONSTRAINT packages_offer_type_check
CHECK (offer_type IN (
  'TYPE_TRAINING_ONLY',
  'TYPE_TRAINING_ACCOM',
  'TYPE_ALL_INCLUSIVE',
  'TYPE_CUSTOM_EXP',
  'TYPE_ONE_TIME_EVENT'
));
