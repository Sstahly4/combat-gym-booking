-- 048_password_policy.sql
--
-- Rolls out the stronger password standard (10 chars + number + symbol +
-- common-fragment blocklist) across the product without forcing existing users
-- to reset immediately. We can only evaluate a stored password when the user
-- signs in with it, so we cache the verdict on the profile.
--
-- Flow:
--   1. New signups pass validatePasswordRules on the client and server, so
--      password_meets_current_policy = true from day one.
--   2. Existing users: at sign-in time we call /api/auth/evaluate-password with
--      the plaintext they just typed. That endpoint updates the flag and,
--      for owners, inserts a password_policy_update notification (dedupe).
--   3. When a user updates their password via the normal flow, we set the
--      flag back to true and mark any open password_policy_update notifications
--      as read.
--
-- Default is TRUE so we don't light up the bell for everyone on deploy — only
-- users whose next sign-in actually fails the rules get flagged.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_meets_current_policy BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.profiles.password_meets_current_policy IS
  'False when the user''s last-observed password failed validatePasswordRules at sign-in. Flipped true on successful password update.';

-- Extend the owner_notifications type enum to include the new policy prompt.
-- We drop + re-add the CHECK constraint because older migrations defined it
-- inline without a named constraint.
ALTER TABLE public.owner_notifications
  DROP CONSTRAINT IF EXISTS owner_notifications_type_check;

ALTER TABLE public.owner_notifications
  ADD CONSTRAINT owner_notifications_type_check
    CHECK (type IN (
      'booking_created',
      'booking_cancelled',
      'review_posted',
      'payout_paid',
      'password_policy_update'
    ));
