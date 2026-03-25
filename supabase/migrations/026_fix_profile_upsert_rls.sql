-- Fix profile upsert RLS issue for signup flow
-- The issue: When users sign up, the trigger creates a profile, but the client-side upsert
-- might fail if the session isn't fully established or there's a race condition.
-- Solution: Ensure UPDATE policy allows users to update their own profile immediately after creation

-- The existing UPDATE policy should work, but let's make sure it's correct
-- Also ensure the INSERT policy allows inserting own profile (should already work)

-- Drop the policy if it exists (idempotent)
DROP POLICY IF EXISTS "Users can update their own profile role" ON profiles;

-- Add a policy to allow users to update their profile role during signup
-- This is needed because the trigger creates profile with role='fighter', 
-- but we need to update it to 'owner' immediately after signup
-- Note: The existing "Users can update their own profile" policy should already cover this,
-- but we're being explicit to ensure it works in all cases.
CREATE POLICY "Users can update their own profile role"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
