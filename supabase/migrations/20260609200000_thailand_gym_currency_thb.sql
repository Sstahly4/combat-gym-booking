-- Thai gyms imported without an explicit currency kept the schema default (USD).
-- Prices are entered in THB, so conversion from gym.currency must be THB.

UPDATE public.gyms
SET currency = 'THB'
WHERE country = 'Thailand'
  AND currency = 'USD';

UPDATE public.packages p
SET currency = 'THB'
FROM public.gyms g
WHERE g.id = p.gym_id
  AND g.country = 'Thailand'
  AND p.currency = 'USD';
