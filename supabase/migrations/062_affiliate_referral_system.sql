-- Affiliate referral system: partners, click tracking, booking attribution, payout runs.

CREATE TYPE public.affiliate_tier AS ENUM ('founding', 'standard');
CREATE TYPE public.affiliate_status AS ENUM ('active', 'paused', 'inactive');
CREATE TYPE public.affiliate_payout_method AS ENUM ('bank', 'paypal');
CREATE TYPE public.affiliate_booking_payout_status AS ENUM ('pending', 'approved', 'paid');
CREATE TYPE public.affiliate_payout_run_status AS ENUM ('pending', 'paid');

CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  commission_rate DECIMAL(5, 4) NOT NULL,
  tier public.affiliate_tier NOT NULL DEFAULT 'standard',
  payout_method public.affiliate_payout_method NOT NULL DEFAULT 'bank',
  payout_details_encrypted TEXT,
  status public.affiliate_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliates_code_format CHECK (code ~ '^[a-z0-9]{1,20}$'),
  CONSTRAINT affiliates_commission_rate_range CHECK (commission_rate > 0 AND commission_rate <= 1)
);

CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates (status);
CREATE INDEX IF NOT EXISTS idx_affiliates_tier ON public.affiliates (tier);

COMMENT ON TABLE public.affiliates IS
  'CombatStay affiliate partners — admin-managed referral program.';
COMMENT ON COLUMN public.affiliates.payout_details_encrypted IS
  'AES-256-GCM encrypted BSB/account or PayPal email; decrypted only in admin API.';

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code VARCHAR(20) NOT NULL REFERENCES public.affiliates (code) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  landing_url VARCHAR(2048),
  user_agent VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON public.affiliate_clicks (affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON public.affiliate_clicks (clicked_at DESC);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS affiliate_code VARCHAR(20) REFERENCES public.affiliates (code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_payout_aud DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS affiliate_payout_status public.affiliate_booking_payout_status,
  ADD COLUMN IF NOT EXISTS affiliate_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS affiliate_paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_affiliate_code
  ON public.bookings (affiliate_code)
  WHERE affiliate_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_affiliate_payout_status
  ON public.bookings (affiliate_payout_status, affiliate_approved_at)
  WHERE affiliate_code IS NOT NULL;

COMMENT ON COLUMN public.bookings.affiliate_code IS
  'First-touch referral code from cs_ref cookie at booking creation.';
COMMENT ON COLUMN public.bookings.affiliate_payout_aud IS
  'Affiliate cut in AUD, computed at booking time from platform_fee × commission_rate.';

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates (id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_bookings INT NOT NULL DEFAULT 0,
  gross_booking_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  combatstay_commission DECIMAL(12, 2) NOT NULL DEFAULT 0,
  affiliate_payout DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status public.affiliate_payout_run_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate_id
  ON public.affiliate_payouts (affiliate_id, period_end DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_payouts_period_unique
  ON public.affiliate_payouts (affiliate_id, period_start, period_end)
  WHERE status = 'paid';

-- updated_at trigger for affiliates
CREATE OR REPLACE FUNCTION public.set_affiliates_updated_at ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_affiliates_updated_at ON public.affiliates;
CREATE TRIGGER trg_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_affiliates_updated_at ();

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Admins can manage affiliates
DROP POLICY IF EXISTS affiliates_admin_all ON public.affiliates;
CREATE POLICY affiliates_admin_all
  ON public.affiliates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Anyone can insert click rows (referral route uses service role); admins read
DROP POLICY IF EXISTS affiliate_clicks_insert_public ON public.affiliate_clicks;
CREATE POLICY affiliate_clicks_insert_public
  ON public.affiliate_clicks
  FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS affiliate_clicks_admin_select ON public.affiliate_clicks;
CREATE POLICY affiliate_clicks_admin_select
  ON public.affiliate_clicks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS affiliate_payouts_admin_all ON public.affiliate_payouts;
CREATE POLICY affiliate_payouts_admin_all
  ON public.affiliate_payouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
