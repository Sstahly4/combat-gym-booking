-- Admin audit log for compliance and operational visibility.
-- Replaces structured server-log JSON writes with a durable DB record.
-- Retention is indefinite; server logs are ephemeral on most providers.
--
-- Current event types:
--   admin_viewed_payout_status   gym_id, gym_name

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  event         text         NOT NULL,
  admin_user_id uuid         REFERENCES public.profiles(id) ON DELETE SET NULL,
  gym_id        uuid         REFERENCES public.gyms(id)     ON DELETE SET NULL,
  metadata      jsonb,
  created_at    timestamptz  DEFAULT now() NOT NULL
);

-- Indexes used by the future admin audit-log viewer and compliance exports.
CREATE INDEX idx_admin_audit_log_admin_user ON public.admin_audit_log (admin_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_log_gym        ON public.admin_audit_log (gym_id,        created_at DESC);
CREATE INDEX idx_admin_audit_log_event      ON public.admin_audit_log (event,         created_at DESC);

-- RLS: admins can read; no one can update or delete audit records.
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Inserts are done via the service-role client (admin SDK) — no user-facing INSERT policy needed.

COMMENT ON TABLE  public.admin_audit_log IS 'Durable record of admin actions on partner data. Not ephemeral like server logs.';
COMMENT ON COLUMN public.admin_audit_log.event IS 'Snake_case event name, e.g. admin_viewed_payout_status.';
COMMENT ON COLUMN public.admin_audit_log.metadata IS 'Arbitrary JSON context for the event (gym_name, etc.).';
