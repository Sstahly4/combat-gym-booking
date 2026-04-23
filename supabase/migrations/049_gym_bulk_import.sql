-- Bulk gym import: idempotency + audit trail for admin CSV imports.

CREATE TABLE IF NOT EXISTS public.gym_bulk_import_batches (
  id UUID PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.gym_bulk_import_batches IS
  'One row per successful admin bulk import commit. Same id prevents double-apply (client-generated UUID).';

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS bulk_import_batch_id UUID;

COMMENT ON COLUMN public.gyms.bulk_import_batch_id IS
  'Set when this draft gym row was created via admin bulk import; used to roll back a failed batch.';

CREATE INDEX IF NOT EXISTS gyms_bulk_import_batch_id_idx
  ON public.gyms (bulk_import_batch_id)
  WHERE bulk_import_batch_id IS NOT NULL;

ALTER TABLE public.gym_bulk_import_batches ENABLE ROW LEVEL SECURITY;
