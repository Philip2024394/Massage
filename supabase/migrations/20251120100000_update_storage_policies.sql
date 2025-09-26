-- Enable RLS on the 'profile-images' bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own files" ON storage.objects;

-- Policy: Allow authenticated users to upload to a folder named after their user_id
CREATE POLICY "Allow authenticated users to upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all files in the 'profile-images' bucket
CREATE POLICY "Allow public read access to profile images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'profile-images'
);

-- Policy: Allow authenticated users to delete files from their own folder
CREATE POLICY "Allow authenticated users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
