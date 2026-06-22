-- Keep gym_amenities junction in sync with gyms.amenities JSONB (Tier 4 SEO mirror).
-- Complements sync_gym_accommodation_flags, which only toggles the accommodation key.

CREATE OR REPLACE FUNCTION public.sync_gym_amenities_from_jsonb(p_gym_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.gym_amenities WHERE gym_id = p_gym_id;

  INSERT INTO public.gym_amenities (gym_id, amenity_id)
  SELECT p_gym_id, a.id
  FROM public.gyms g
  CROSS JOIN LATERAL jsonb_each(COALESCE(g.amenities, '{}'::jsonb)) AS kv(key, val)
  JOIN public.amenities a ON a.key = kv.key
  WHERE g.id = p_gym_id
    AND kv.val = 'true'::jsonb
  ON CONFLICT DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.sync_gym_amenities_from_jsonb(uuid) IS
  'Rebuilds gym_amenities rows from gyms.amenities JSONB booleans.';

CREATE OR REPLACE FUNCTION public.trg_gyms_sync_amenities_junction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_gym_amenities_from_jsonb(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gyms_sync_amenities_junction ON public.gyms;
CREATE TRIGGER gyms_sync_amenities_junction
  AFTER INSERT OR UPDATE OF amenities ON public.gyms
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_gyms_sync_amenities_junction();

-- One-time backfill for any drift since the initial junction seed.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.gyms LOOP
    PERFORM public.sync_gym_amenities_from_jsonb(r.id);
  END LOOP;
END;
$$;
