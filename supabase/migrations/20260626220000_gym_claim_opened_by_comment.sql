-- Document session-based opener detection (replaces the old 5-minute heuristic).
COMMENT ON COLUMN public.gym_claim_tokens.first_opened_by IS
  'Who opened /claim/<token>: admin = signed-in admin hub session at click time; owner = everyone else (typical gym owner, logged out).';
