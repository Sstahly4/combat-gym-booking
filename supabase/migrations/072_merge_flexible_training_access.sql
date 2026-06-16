-- Merge deprecated flexible_daily into once_daily.

UPDATE public.packages
SET training_access = 'once_daily'
WHERE training_access = 'flexible_daily';

-- Keep the check constraint permissive for backward compatibility.
-- (We can tighten it to two values once all environments are normalized.)
