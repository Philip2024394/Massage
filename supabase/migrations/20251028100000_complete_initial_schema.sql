/*
# [Complete Initial Schema Setup]
This script performs a full cleanup and recreation of the application's database schema. It drops any existing tables, types, and functions related to the app to ensure a clean slate, then rebuilds everything including tables, relationships, row-level security (RLS) policies, and storage buckets.

## Query Description: This operation is destructive to any data in the 'therapists' and 'reviews' tables. It is designed to be run on a fresh or broken development database. Before running this on a database with important data, please ensure you have a backup.

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Drops: All policies, tables ('reviews', 'therapists'), types ('therapist_status', 'review_status'), and functions ('handle_new_user').
- Creates: Types ('therapist_status', 'review_status'), tables ('therapists', 'reviews'), RLS policies for both tables, a trigger function ('handle_new_user') for new user profiles, and a storage bucket ('profile-images') with policies.

## Security Implications:
- RLS Status: Enabled on 'therapists' and 'reviews' tables.
- Policy Changes: Yes, creates all necessary policies for public reads, user-specific writes, and admin access.
- Auth Requirements: Policies are linked to `auth.uid()` for user-specific access.

## Performance Impact:
- Indexes: Primary keys and foreign keys will have indexes created automatically.
- Triggers: Adds a trigger to `auth.users` which runs on new user creation.
- Estimated Impact: Low, as it's an initial setup.
*/

-- 1. Clean up any previous objects to ensure a fresh start.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.therapists;
DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.review_status;

-- 2. Create custom ENUM types for status fields.
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Create the 'therapists' table to store their profiles.
CREATE TABLE public.therapists (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text UNIQUE,
    profile_image_url text,
    bio text,
    experience integer,
    is_online boolean DEFAULT false NOT NULL,
    status therapist_status DEFAULT 'pending' NOT NULL,
    lat double precision,
    lng double precision,
    city text,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    massage_types text[],
    specialties text[],
    phone text,
    languages text[],
    certifications text[],
    therapist_number text UNIQUE,
    rating real DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL
);
COMMENT ON TABLE public.therapists IS 'Stores profile information for massage therapists.';

-- 4. Create the 'reviews' table.
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating &gt;= 1 AND rating &lt;= 5),
    comment text NOT NULL,
    status review_status DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for therapists.';

-- 5. Enable Row Level Security (RLS) on the tables.
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS policies for the 'therapists' table.
CREATE POLICY "Allow public read access on therapists" ON public.therapists FOR SELECT USING (true);
CREATE POLICY "Allow individual update access on therapists" ON public.therapists FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin full access on therapists" ON public.therapists FOR ALL USING (
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb
);


-- 7. Define RLS policies for the 'reviews' table.
CREATE POLICY "Allow public read access on reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access on reviews" ON public.reviews FOR ALL USING (
  (get_my_claim('user_role'::text)) = '"admin"'::jsonb
);

-- 8. Create a function to automatically create a therapist profile when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.therapists (id, name, email, phone, therapist_number, experience)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data-&gt;&gt;'name',
    NEW.email,
    NEW.raw_user_meta_data-&gt;&gt;'phone',
    NEW.raw_user_meta_data-&gt;&gt;'therapistNumber',
    (NEW.raw_user_meta_data-&gt;&gt;'experience')::integer
  );
  RETURN NEW;
END;
$$;

-- 9. Create a trigger to call the function after a new user is inserted into auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Set up Storage for profile images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Define Storage policies.
CREATE POLICY "Allow public read on profile images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-images' );

CREATE POLICY "Allow individual insert on profile images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'profile-images' AND auth.uid() = (storage.foldername(name))[1]::uuid );

CREATE POLICY "Allow individual update on profile images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'profile-images' AND auth.uid() = (storage.foldername(name))[1]::uuid );
