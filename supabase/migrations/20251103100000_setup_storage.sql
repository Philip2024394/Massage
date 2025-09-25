/*
# [Feature] Activate Supabase Storage for Profile Images

This migration script sets up the Supabase Storage bucket required for user profile and gallery images. It creates the `profile-images` bucket and applies the necessary access policies.

## Query Description:
This script creates a public storage bucket named `profile-images`. It then sets highly permissive Row Level Security (RLS) policies that allow any anonymous user to view, upload, and delete images. These permissions are required for the current application's client-side image management features to function correctly.

**SECURITY WARNING:** The policies for `INSERT` and `DELETE` are intentionally broad due to the application's architecture, which lacks server-side authorization for storage operations. This configuration poses a security risk, as it could potentially allow unauthorized users to upload arbitrary files or delete existing images if they can guess the file paths. A more secure long-term solution would involve refactoring the application to use signed URLs for uploads and a secure edge function for deletions.

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Medium"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Creates storage bucket: `profile-images`
- Creates policies on `storage.objects`:
  - "Allow public read access" (SELECT)
  - "Allow anonymous uploads" (INSERT)
  - "Allow anonymous deletes" (DELETE)

## Security Implications:
- RLS Status: Enabled on `storage.objects`.
- Policy Changes: Yes. Adds permissive policies for anonymous users.
- Auth Requirements: The policies are designed for the `anon` role, as the client-side code operates without a Supabase-authenticated user session.

## Performance Impact:
- Indexes: None.
- Triggers: None.
- Estimated Impact: Low. Standard storage operations.
*/

-- Create the 'profile-images' bucket if it doesn't already exist.
-- This bucket is public to allow direct access to image URLs.
-- File size is limited to 5MB and only common image types are allowed.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies on the `storage.objects` table for the `profile-images` bucket to ensure a clean slate.
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous deletes" ON storage.objects;

-- Recreate policies for the `profile-images` bucket.

-- 1. Allow public, anonymous access to view all images.
-- This is necessary for the app to display profile and gallery photos.
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-images');

-- 2. Allow anonymous users to upload images.
-- SECURITY WARNING: This is a permissive policy required by the current app architecture where uploads happen client-side without Supabase JWT auth.
CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'profile-images');

-- 3. Allow anonymous users to delete images.
-- SECURITY WARNING: This is a highly permissive policy, required for the "delete gallery image" feature to work.
CREATE POLICY "Allow anonymous deletes"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'profile-images');
