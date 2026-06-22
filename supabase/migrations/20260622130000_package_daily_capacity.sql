-- Optional per-day capacity for drop-in packages (NULL = unlimited).

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS daily_capacity INTEGER;

ALTER TABLE packages
  DROP CONSTRAINT IF EXISTS packages_daily_capacity_nonneg;

ALTER TABLE packages
  ADD CONSTRAINT packages_daily_capacity_nonneg
  CHECK (daily_capacity IS NULL OR daily_capacity >= 0);

COMMENT ON COLUMN packages.daily_capacity IS
  'Max occupying bookings per visit day for drop-in packages. NULL = no limit.';
