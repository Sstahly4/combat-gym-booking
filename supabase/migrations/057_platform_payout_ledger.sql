-- Platform payout ledger: batches of owner payouts (Wise, manual bank, future rails).
-- Stripe Connect listings continue to use Stripe balance / payout APIs — not this table.

CREATE TABLE IF NOT EXISTS public.gym_platform_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms (id) ON DELETE CASCADE,
  rail TEXT NOT NULL DEFAULT 'wise'
    CHECK (rail IN ('wise', 'manual', 'other')),
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL,
  external_reference TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gym_platform_payouts_gym_id ON public.gym_platform_payouts (gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_platform_payouts_completed
  ON public.gym_platform_payouts (gym_id, completed_at DESC NULLS LAST);

COMMENT ON TABLE public.gym_platform_payouts IS
  'Platform-initiated payouts to listing owners (Wise sandbox/live, manual reconciliation, etc.). '
  'Not used when payout_rail = stripe_connect.';

COMMENT ON COLUMN public.gym_platform_payouts.rail IS
  'Settlement channel used for this transfer (wise, manual bank run, or other future rails).';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS platform_payout_id UUID REFERENCES public.gym_platform_payouts (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS platform_paid_out_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_platform_payout_id
  ON public.bookings (platform_payout_id)
  WHERE platform_payout_id IS NOT NULL;

COMMENT ON COLUMN public.bookings.platform_payout_id IS
  'Links this booking to a row in gym_platform_payouts when its host share was included in that transfer.';
COMMENT ON COLUMN public.bookings.platform_paid_out_at IS
  'When the host share for this booking was marked paid out on the platform rail (null = not yet transferred).';

-- Prevent owners from forging payout-settled flags; only admin JWT or service role may change these columns.
CREATE OR REPLACE FUNCTION public.prevent_booking_platform_payout_self_edit ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Strip forged payout flags on public inserts (e.g. guest checkout); service role / admin may set.
    IF auth.uid () IS NULL THEN
      RETURN NEW;
    END IF;
    IF EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid ()
        AND p.role = 'admin') THEN
      RETURN NEW;
    END IF;
    NEW.platform_payout_id := NULL;
    NEW.platform_paid_out_at := NULL;
    RETURN NEW;
  END IF;
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF (OLD.platform_payout_id IS DISTINCT FROM NEW.platform_payout_id)
    OR (OLD.platform_paid_out_at IS DISTINCT FROM NEW.platform_paid_out_at) THEN
    -- Service role / Postgres superuser: jwt sub unset — allow.
    IF auth.uid () IS NULL THEN
      RETURN NEW;
    END IF;
    IF EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid ()
        AND p.role = 'admin') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'platform_payout_id and platform_paid_out_at can only be set by the platform (admin or service role)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_booking_platform_payout_self_edit ON public.bookings;
DROP TRIGGER IF EXISTS trg_prevent_booking_platform_payout_self_edit_ins ON public.bookings;
DROP TRIGGER IF EXISTS trg_prevent_booking_platform_payout_self_edit_upd ON public.bookings;

CREATE TRIGGER trg_prevent_booking_platform_payout_self_edit_ins
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_booking_platform_payout_self_edit ();

CREATE TRIGGER trg_prevent_booking_platform_payout_self_edit_upd
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_booking_platform_payout_self_edit ();

ALTER TABLE public.gym_platform_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their gym platform payouts"
  ON public.gym_platform_payouts
  FOR SELECT
  USING (EXISTS (
      SELECT
        1
      FROM
        public.gyms
      WHERE
        gyms.id = gym_platform_payouts.gym_id
        AND gyms.owner_id = auth.uid ()));

CREATE POLICY "Admins can view all gym platform payouts"
  ON public.gym_platform_payouts
  FOR SELECT
  USING (EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.id = auth.uid ()
        AND p.role = 'admin'));
