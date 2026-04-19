-- Milestone 3C: owner replies on reviews
BEGIN;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS owner_reply TEXT,
ADD COLUMN IF NOT EXISTS owner_replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS owner_replied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_gym_created
ON public.reviews(gym_id, created_at DESC);

COMMIT;
