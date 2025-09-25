/*
# [Operation Name]
Secure Storage Bucket Policies

## Query Description: [This operation will lock down the `profile-images` storage bucket. It removes any broad insert, update, or delete policies and ensures that only public read access is allowed. All write and delete operations will now be denied unless performed by a privileged role, such as the `service_role` used by our backend functions. This is a critical security enhancement to prevent unauthorized file manipulation.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects policies on the `storage.objects` table for the `profile-images` bucket.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [This change makes the system reliant on backend functions for storage writes/deletes.]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [No performance impact.]
*/

-- Drop any potentially insecure, broad policies that might exist from previous setups.
-- It's safe to run these even if the policies don't exist.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;


-- Create a single, explicit policy that allows public, read-only access to all files.
-- This is necessary so that images can be displayed in the browser.
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'profile-images' );

-- NOTE: By not creating any INSERT, UPDATE, or DELETE policies for public roles ('anon', 'authenticated'),
-- we effectively block all client-side write access to the bucket. Only the 'service_role' (used by our
-- backend Edge Functions) will be able to modify the storage contents, which is the desired secure behavior.
