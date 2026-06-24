-- Phase 1: Google Popular Times baseline per gym (seeded via local CLI worker).
-- popular_times: 7-day hourly histogram JSONB; live booking overlays come in Phase 2.

BEGIN;

CREATE TABLE IF NOT EXISTS public.gym_busyness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  popular_times JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'unknown'
    CHECK (source IN ('google', 'nearby_clone', 'template', 'unknown')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gym_busyness_gym_id_unique UNIQUE (gym_id)
);

COMMENT ON TABLE public.gym_busyness IS
  'Historical busyness baseline per gym (Google Popular Times or fallbacks). Seeded by offline worker.';

COMMENT ON COLUMN public.gym_busyness.popular_times IS
  '7-day hourly histogram: [{ day: "Monday", hours: [{ hour: 7, percentage: 85 }, ...] }, ...]';

COMMENT ON COLUMN public.gym_busyness.source IS
  'Provenance: google (scraped), nearby_clone, template (Muay Thai default curve), unknown.';

CREATE INDEX IF NOT EXISTS idx_gym_busyness_gym_id ON public.gym_busyness (gym_id);

DROP TRIGGER IF EXISTS trg_gym_busyness_updated_at ON public.gym_busyness;
CREATE TRIGGER trg_gym_busyness_updated_at
  BEFORE UPDATE ON public.gym_busyness
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.gym_busyness ENABLE ROW LEVEL SECURITY;

-- Public: read busyness for approved gyms (same visibility as guest booking UI)
DROP POLICY IF EXISTS "Public reads busyness of approved gyms" ON public.gym_busyness;
CREATE POLICY "Public reads busyness of approved gyms"
  ON public.gym_busyness
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE g.id = gym_busyness.gym_id
        AND g.status = 'approved'
    )
  );

-- Admins: full access (dashboard tooling)
DROP POLICY IF EXISTS "Admins manage all gym busyness" ON public.gym_busyness;
CREATE POLICY "Admins manage all gym busyness"
  ON public.gym_busyness
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

COMMIT;
