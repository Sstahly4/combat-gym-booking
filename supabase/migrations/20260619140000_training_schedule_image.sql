-- Optional timetable photo (JPEG/PNG) shown on gym profile instead of structured JSON schedule.
ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS training_schedule_image TEXT,
  ADD COLUMN IF NOT EXISTS training_schedule_use_image BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN gyms.training_schedule_image IS
  'Stored image ref (URL or JSON variants) for weekly timetable when use_image is true.';
COMMENT ON COLUMN gyms.training_schedule_use_image IS
  'When true, public profile shows training_schedule_image instead of structured training_schedule JSON.';
