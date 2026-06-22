-- Add TYPE_DROP_IN offer type for single-day session drop-ins at the gym

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_offer_type_check;

ALTER TABLE packages
ADD CONSTRAINT packages_offer_type_check
CHECK (offer_type IN (
  'TYPE_TRAINING_ONLY',
  'TYPE_TRAINING_ACCOM',
  'TYPE_ALL_INCLUSIVE',
  'TYPE_CUSTOM_EXP',
  'TYPE_ONE_TIME_EVENT',
  'TYPE_DROP_IN'
));
