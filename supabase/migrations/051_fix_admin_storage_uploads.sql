-- Fix Storage RLS for admin uploads to gym-images
--
-- Symptom:
-- Admin Hub image uploads fail with:
--   "new row violates row-level security policy"
-- on storage.objects INSERT.
--
-- This migration ensures owners AND admins can INSERT/UPDATE/DELETE objects
-- in the `gym-images` bucket (public SELECT remains allowed).

-- INSERT: upload new objects
DROP POLICY IF EXISTS "Owners can upload gym images" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can upload gym images" ON storage.objects;

CREATE POLICY "Owners and admins can upload gym images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gym-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    )
  );

-- UPDATE: required for overwrites / upserts / metadata updates
DROP POLICY IF EXISTS "Owners and admins can update gym images" ON storage.objects;

CREATE POLICY "Owners and admins can update gym images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gym-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'gym-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    )
  );

-- DELETE: remove objects (e.g. when deleting gallery images)
DROP POLICY IF EXISTS "Owners can delete gym images" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can delete gym images" ON storage.objects;

CREATE POLICY "Owners and admins can delete gym images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gym-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    )
  );

