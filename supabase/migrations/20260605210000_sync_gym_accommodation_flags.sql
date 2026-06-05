-- Backfill + keep gyms.offers_accommodation and gyms.amenities.accommodation
-- in sync with active accommodation rows (search filters on amenities->accommodation).

CREATE OR REPLACE FUNCTION public.sync_gym_accommodation_flags(p_gym_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_active_rooms boolean;
  has_accom_packages boolean;
  should_offer boolean;
  current_amenities jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.accommodations
    WHERE gym_id = p_gym_id AND is_active = true
  ) INTO has_active_rooms;

  SELECT EXISTS (
    SELECT 1 FROM public.packages
    WHERE gym_id = p_gym_id AND includes_accommodation = true
  ) INTO has_accom_packages;

  should_offer := has_active_rooms OR has_accom_packages;

  SELECT COALESCE(amenities, '{}'::jsonb) INTO current_amenities
  FROM public.gyms WHERE id = p_gym_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.gyms
  SET
    offers_accommodation = should_offer,
    amenities = current_amenities || jsonb_build_object('accommodation', should_offer)
  WHERE id = p_gym_id;

  IF should_offer THEN
    INSERT INTO public.gym_amenities (gym_id, amenity_id)
    SELECT p_gym_id, a.id
    FROM public.amenities a
    WHERE a.key = 'accommodation'
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.gym_amenities ga
    USING public.amenities a
    WHERE ga.gym_id = p_gym_id
      AND ga.amenity_id = a.id
      AND a.key = 'accommodation';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.sync_gym_accommodation_flags(uuid) IS
  'Sets offers_accommodation + amenities.accommodation from active rooms or accom packages; syncs gym_amenities junction.';

-- Trigger: any accommodation row change re-syncs parent gym flags.
CREATE OR REPLACE FUNCTION public.trg_accommodations_sync_gym_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_gym_id uuid;
BEGIN
  target_gym_id := COALESCE(NEW.gym_id, OLD.gym_id);
  PERFORM public.sync_gym_accommodation_flags(target_gym_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS accommodations_sync_gym_flags ON public.accommodations;
CREATE TRIGGER accommodations_sync_gym_flags
  AFTER INSERT OR UPDATE OF is_active, gym_id OR DELETE
  ON public.accommodations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_accommodations_sync_gym_flags();

-- One-time backfill for all gyms (rooms + packages).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT gym_id AS id FROM public.accommodations WHERE is_active = true
    UNION
    SELECT DISTINCT gym_id AS id FROM public.packages WHERE includes_accommodation = true
  LOOP
    PERFORM public.sync_gym_accommodation_flags(r.id);
  END LOOP;
END;
$$;
