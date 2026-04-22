-- Replace the `packages` RLS policy so that admins can also manage any
-- gym's packages, matching the admin-bypass pattern used by other tables
-- in this schema (offers, gym_promotions, bookings, etc.).
--
-- Previously the policy only allowed the gym's owner (auth.uid() = gyms.owner_id)
-- to manage packages, which locked admins out of gyms they don't own.

DROP POLICY IF EXISTS "Users can manage packages for their own gyms" ON public.packages;
DROP POLICY IF EXISTS "Owners and admins can manage packages" ON public.packages;

CREATE POLICY "Owners and admins can manage packages"
  ON public.packages
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.gyms WHERE id = packages.gym_id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.gyms WHERE id = packages.gym_id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
