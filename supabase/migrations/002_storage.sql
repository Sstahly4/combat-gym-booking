-- Create the storage bucket for gym images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-images', 'gym-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view images
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'gym-images' );

-- Policy to allow gym owners to upload images
CREATE POLICY "Owners can upload gym images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gym-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- Policy to allow gym owners to delete their own images (assuming they upload with their user ID as prefix or we just trust them for MVP)
-- For MVP we just allow owners to delete any image in the bucket for simplicity, or we can refine.
-- Let's just allow owners to manage objects.
CREATE POLICY "Owners can delete gym images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gym-images' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );
