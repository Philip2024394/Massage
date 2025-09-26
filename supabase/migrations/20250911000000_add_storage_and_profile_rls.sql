/*
          # [Operation Name]
          Enable Client-Side Uploads via RLS

          ## Query Description: [This migration enables Row Level Security (RLS) on the storage and profile tables. It creates policies that allow users to securely upload and manage their own images and update their own profile data directly from the browser. This is a safe and standard Supabase pattern that improves security and removes the need for a separate backend function for these tasks. There is no risk to existing data.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Enables RLS on `storage.objects`, `public.therapists`, `public.places`.
          - Adds `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies to `storage.objects`.
          - Adds `SELECT`, `UPDATE` policies to `public.therapists` and `public.places`.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Policies are based on `auth.uid()` to ensure users can only access their own data.]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible. RLS is highly optimized in PostgreSQL.]
          */

-- 1. Enable RLS on the tables
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for therapists table
CREATE POLICY "Enable read access for own therapist profile" ON public.therapists FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable update for own therapist profile" ON public.therapists FOR UPDATE USING (auth.uid() = id);

-- 3. Create policies for places table
CREATE POLICY "Enable read access for own place profile" ON public.places FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable update for own place profile" ON public.places FOR UPDATE USING (auth.uid() = id);

-- 4. Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for storage access
CREATE POLICY "Allow public read access to profile images" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Allow authenticated users to upload to own folder" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated users to update their own files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated users to delete their own files" ON storage.objects FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
