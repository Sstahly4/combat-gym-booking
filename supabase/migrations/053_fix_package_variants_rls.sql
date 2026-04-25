-- Fix package_variants RLS so admins can manage variants (same pattern as 047_admin_manage_packages).
--
-- Symptom:
--   "new row violates row-level security policy for table "package_variants""
--   when an admin saves a Train & Stay / All-inclusive offer that creates room-priced variants.
--
-- Root cause:
--   007_create_package_variants only allows the gym owner to write variants.
--   047_admin_manage_packages fixed the `packages` table but missed `package_variants`.

DROP POLICY IF EXISTS "Users can manage variants for their own gyms" ON public.package_variants;
DROP POLICY IF EXISTS "Owners and admins can manage package variants" ON public.package_variants;

CREATE POLICY "Owners and admins can manage package variants"
  ON public.package_variants
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT gyms.owner_id
      FROM public.gyms
      JOIN public.packages ON packages.gym_id = gyms.id
      WHERE packages.id = package_variants.package_id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT gyms.owner_id
      FROM public.gyms
      JOIN public.packages ON packages.gym_id = gyms.id
      WHERE packages.id = package_variants.package_id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
