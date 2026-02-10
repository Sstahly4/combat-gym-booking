-- Update storage policy to allow admins to upload gym images
-- This allows admins to edit gyms and upload images on behalf of owners

-- Drop the existing policy
DROP POLICY IF EXISTS "Owners can upload gym images" ON storage.objects;

-- Create new policy that allows both owners and admins
CREATE POLICY "Owners and admins can upload gym images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gym-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'owner' OR profiles.role = 'admin')
    )
  );

-- Also update the delete policy to allow admins
DROP POLICY IF EXISTS "Owners can delete gym images" ON storage.objects;

CREATE POLICY "Owners and admins can delete gym images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gym-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'owner' OR profiles.role = 'admin')
    )
  );