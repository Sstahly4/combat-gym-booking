-- Fix gym_images RLS so owners can INSERT rows.
-- Postgres RLS requires a WITH CHECK clause for INSERT/UPDATE.

-- Replace the original owner policy with one that includes WITH CHECK.
DROP POLICY IF EXISTS "Owners can manage images of their gyms" ON public.gym_images;
CREATE POLICY "Owners can manage images of their gyms"
  ON public.gym_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE gyms.id = gym_images.gym_id
        AND gyms.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gyms
      WHERE gyms.id = gym_images.gym_id
        AND gyms.owner_id = auth.uid()
    )
  );

-- Optional: allow platform admins to manage gym images via the Data API.
DROP POLICY IF EXISTS "Admins can manage gym images" ON public.gym_images;
CREATE POLICY "Admins can manage gym images"
  ON public.gym_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

