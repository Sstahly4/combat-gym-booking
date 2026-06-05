-- Normalize gym amenities for programmatic Tier 4 SEO routes.
-- Source of truth for owner edits remains gyms.amenities (JSONB booleans).
-- amenities + gym_amenities are a read-optimized mirror for slug-based queries.
-- Seed list mirrors lib/constants/gym-amenities.ts (GYM_AMENITY_LABELS).

-- 1. Master amenities lookup
CREATE TABLE IF NOT EXISTS public.amenities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,   -- JSONB key on gyms.amenities (e.g. air_conditioning)
  name       text NOT NULL,          -- UI label (e.g. Air conditioning)
  slug       text UNIQUE NOT NULL,   -- SEO URL segment (e.g. private-ac-room)
  category   text,                   -- facility | stay | classes | training | gear | recovery | operations
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.amenities IS
  'Canonical amenity catalog; keys match gyms.amenities JSONB booleans.';
COMMENT ON COLUMN public.amenities.key IS 'Stable internal key — must match gyms.amenities JSONB property names.';
COMMENT ON COLUMN public.amenities.slug IS 'URL-safe segment for Tier 4 programmatic pages.';

-- 2. Gym ↔ amenity junction
CREATE TABLE IF NOT EXISTS public.gym_amenities (
  gym_id     uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (gym_id, amenity_id)
);

COMMENT ON TABLE public.gym_amenities IS
  'Many-to-many mirror of gyms.amenities JSONB; backfilled once, kept in sync by future trigger/app layer.';

CREATE INDEX IF NOT EXISTS idx_gym_amenities_amenity_id ON public.gym_amenities(amenity_id);
CREATE INDEX IF NOT EXISTS idx_amenities_slug ON public.amenities(slug);

-- 3. Seed from GYM_AMENITY_LABELS (lib/constants/gym-amenities.ts)
INSERT INTO public.amenities (key, name, slug, category) VALUES
  -- Facility & comfort
  ('accommodation',         'On-site accommodation',                              'with-accommodation',       'stay'),
  ('wifi',                  'Wi-Fi',                                              'wifi',                     'facility'),
  ('air_conditioning',      'Air conditioning',                                   'private-ac-room',          'facility'),
  ('parking',               'Parking',                                            'parking',                  'facility'),
  ('showers',               'Showers',                                            'showers',                  'facility'),
  ('locker_room',           'Locker room',                                        'locker-room',              'facility'),
  ('changing_rooms',        'Changing rooms',                                     'changing-rooms',           'facility'),
  ('meals',                 'Meals / kitchen access',                             'with-meals',               'stay'),
  ('water_station',         'Water station',                                      'water-station',            'facility'),
  ('first_aid',             'First aid',                                          'first-aid',                'facility'),
  ('fire_safety',           'Fire safety (extinguishers, signage)',               'fire-safety',              'facility'),
  ('security',              'On-site security / staff',                           'on-site-security',         'facility'),
  ('wheelchair_accessible', 'Wheelchair accessible',                              'wheelchair-accessible',    'facility'),
  ('laundry',               'Laundry',                                            'laundry',                  'facility'),
  ('towel_service',         'Towel service',                                      'towel-service',            'facility'),

  -- Classes & coaching
  ('group_classes',         'Group classes',                                      'group-classes',            'classes'),
  ('private_classes',       'Private / 1-on-1 classes',                           'private-classes',          'classes'),
  ('beginner_friendly',     'Beginner friendly',                                  'beginner-friendly',        'classes'),
  ('competition_prep',      'Competition prep',                                   'competition-prep',         'classes'),
  ('english_speaking',      'English-speaking coaches',                           'english-speaking-coaches', 'classes'),
  ('kids_classes',          'Kids / youth classes',                               'kids-classes',             'classes'),

  -- Training areas & equipment
  ('boxing_ring',           'Boxing ring',                                        'boxing-ring',              'training'),
  ('mma_cage',              'MMA cage',                                           'mma-cage',                 'training'),
  ('wrestling_mats',        'Wrestling / grappling mats',                         'wrestling-mats',           'training'),
  ('heavy_bags',            'Heavy bags',                                         'heavy-bags',               'training'),
  ('speed_bags',            'Speed bags',                                         'speed-bags',               'training'),
  ('pad_work_area',         'Pads / mitt work area',                              'pad-work-area',            'training'),
  ('clinch_area',           'Clinch / Muay Thai ropes area',                      'clinch-area',              'training'),
  ('free_weights',          'Free weights',                                       'free-weights',             'training'),
  ('cardio_equipment',      'Cardio machines',                                    'cardio-equipment',         'training'),
  ('weight_room',           'Dedicated weights area',                             'weight-room',              'training'),
  ('outdoor_training',      'Outdoor training area',                              'outdoor-training',         'training'),

  -- Gear & retail
  ('rental_equipment',      'Equipment rental (gloves, shin guards, etc.)',       'equipment-rental',         'gear'),
  ('headgear_available',    'Headgear available',                                 'headgear-available',       'gear'),
  ('hand_wraps_available',  'Hand wraps for sale / included',                     'hand-wraps-available',     'gear'),
  ('pro_shop',              'Pro shop / gear sales',                              'pro-shop',                 'gear'),

  -- Recovery & wellness
  ('massage',               'Massage',                                            'massage',                  'recovery'),
  ('physiotherapy',         'Physio / sports therapy',                            'on-site-physiotherapy',    'recovery'),
  ('ice_bath',              'Ice bath / cold plunge',                             'ice-bath',                 'recovery'),
  ('sauna',                 'Sauna',                                              'sauna',                    'recovery'),
  ('steam_room',            'Steam room',                                         'steam-room',               'recovery'),
  ('hot_tub',               'Hot tub / jacuzzi',                                  'hot-tub',                  'recovery'),
  ('yoga_studio',           'Yoga / mobility space',                              'yoga-studio',              'recovery'),
  ('swimming_pool',         'Pool (cross-training)',                              'swimming-pool',            'recovery'),

  -- Operations & travel
  ('twenty_four_hour',      '24/7 access',                                        '24-hour-access',           'operations'),
  ('airport_transfer',      'Airport transfer (available)',                       'airport-transfer',         'operations'),
  ('visa_assistance',       'Visa / stay guidance',                               'visa-assistance',          'operations')
ON CONFLICT (key) DO NOTHING;

-- 4. Backfill junction from gyms.amenities JSONB (native boolean true only)
INSERT INTO public.gym_amenities (gym_id, amenity_id)
SELECT g.id, a.id
FROM public.gyms g
CROSS JOIN LATERAL jsonb_each(g.amenities) AS kv(key, val)
JOIN public.amenities a ON a.key = kv.key
WHERE kv.val = 'true'::jsonb
ON CONFLICT DO NOTHING;

-- 5. RLS — public read for SEO routes; owners/admins can read pending gyms too
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read amenities catalog" ON public.amenities;
CREATE POLICY "Anyone can read amenities catalog"
  ON public.amenities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read amenities of approved gyms" ON public.gym_amenities;
CREATE POLICY "Anyone can read amenities of approved gyms"
  ON public.gym_amenities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE g.id = gym_amenities.gym_id AND g.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Owners can read amenities of their gyms" ON public.gym_amenities;
CREATE POLICY "Owners can read amenities of their gyms"
  ON public.gym_amenities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE g.id = gym_amenities.gym_id AND g.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can read all gym amenities" ON public.gym_amenities;
CREATE POLICY "Admins can read all gym amenities"
  ON public.gym_amenities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

GRANT SELECT ON public.amenities TO anon, authenticated, service_role;
GRANT SELECT ON public.gym_amenities TO anon, authenticated, service_role;
