-- Package seasonal rate overrides (blended into tier waterfall at checkout).
--
-- Owners set date-range tiers per package (optionally per variant). At booking time
-- the app averages daily/weekly/monthly rates across each calendar day of the stay,
-- then passes the blended tier into calculatePackagePrice().

BEGIN;

CREATE TABLE IF NOT EXISTS public.package_seasonal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.package_variants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  price_per_day NUMERIC(10, 2),
  price_per_week NUMERIC(10, 2),
  price_per_month NUMERIC(10, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  CONSTRAINT package_seasonal_rates_valid_date_range CHECK (start_date <= end_date),
  CONSTRAINT package_seasonal_rates_price_nonneg CHECK (
    (price_per_day IS NULL OR price_per_day >= 0)
    AND (price_per_week IS NULL OR price_per_week >= 0)
    AND (price_per_month IS NULL OR price_per_month >= 0)
  ),
  CONSTRAINT package_seasonal_rates_has_tier CHECK (
    price_per_day IS NOT NULL
    OR price_per_week IS NOT NULL
    OR price_per_month IS NOT NULL
  )
);

COMMENT ON TABLE public.package_seasonal_rates IS
  'Date-range price tier overrides for packages. Blended per calendar day at checkout.';

COMMENT ON COLUMN public.package_seasonal_rates.variant_id IS
  'NULL = applies to all variants of the package; set for room/tier-specific seasons.';

CREATE INDEX IF NOT EXISTS idx_seasonal_rates_lookup
  ON public.package_seasonal_rates (package_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_seasonal_rates_variant
  ON public.package_seasonal_rates (variant_id)
  WHERE variant_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_package_seasonal_rates_updated_at ON public.package_seasonal_rates;
CREATE TRIGGER trg_package_seasonal_rates_updated_at
  BEFORE UPDATE ON public.package_seasonal_rates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.package_seasonal_rates ENABLE ROW LEVEL SECURITY;

-- Owners manage seasons for their gym packages
DROP POLICY IF EXISTS "Owners manage package seasonal rates" ON public.package_seasonal_rates;
CREATE POLICY "Owners manage package seasonal rates"
  ON public.package_seasonal_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.packages p
      JOIN public.gyms g ON g.id = p.gym_id
      WHERE p.id = package_seasonal_rates.package_id
        AND g.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.packages p
      JOIN public.gyms g ON g.id = p.gym_id
      WHERE p.id = package_seasonal_rates.package_id
        AND g.owner_id = auth.uid()
    )
  );

-- Public read for approved gyms (checkout price resolution)
DROP POLICY IF EXISTS "Public reads seasonal rates for approved gyms" ON public.package_seasonal_rates;
CREATE POLICY "Public reads seasonal rates for approved gyms"
  ON public.package_seasonal_rates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.packages p
      JOIN public.gyms g ON g.id = p.gym_id
      WHERE p.id = package_seasonal_rates.package_id
        AND g.status = 'approved'
    )
  );

-- Admins: full access
DROP POLICY IF EXISTS "Admins manage all package seasonal rates" ON public.package_seasonal_rates;
CREATE POLICY "Admins manage all package seasonal rates"
  ON public.package_seasonal_rates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

COMMIT;
