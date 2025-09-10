/*
# [Complete Schema Reset and Rebuild]
This script will completely reset and rebuild the database schema for the 2Go Massage Hub application.
It drops all existing related tables, types, functions, and policies to ensure a clean state before recreating them.

## Query Description:
- **Impact:** This is a DESTRUCTIVE operation for the `therapists` and `reviews` tables. Any existing data in these tables will be permanently deleted. It is safe to run if you are setting up the project for the first time or if the previous migrations have failed.
- **Safety:** Do NOT run this on a production database with live user data without a full backup.
- **Action:** It creates the `therapists` and `reviews` tables, sets up automatic profile creation for new users, and implements Row Level Security to protect user data. It also configures policies for the `profile-images` storage bucket.

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- **Tables Dropped:** `public.reviews`, `public.therapists`
- **Types Dropped:** `public.review_status`, `public.therapist_status`
- **Functions Dropped:** `public.handle_new_user`
- **Tables Created:** `public.therapists`, `public.reviews`
- **Types Created:** `public.therapist_status`, `public.review_status`
- **Functions Created:** `public.handle_new_user`
- **Triggers Created:** `on_auth_user_created` on `auth.users`
- **RLS Policies Created:** For `therapists`, `reviews`, and `storage.objects`.

## Security Implications:
- RLS Status: Enabled on `therapists` and `reviews`.
- Policy Changes: Yes, policies are created to allow public reads, user-specific writes, and admin-level access.
- Auth Requirements: Policies are linked to `auth.uid()` and user email for access control.

## Performance Impact:
- Indexes: Primary keys and foreign keys create indexes automatically.
- Triggers: One trigger is added to `auth.users` for new user handling.
- Estimated Impact: Minimal performance impact on a new database.
*/

-- 1. CLEANUP PHASE: Drop existing objects to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();

DROP POLICY IF EXISTS "Admin full access on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow anonymous insert on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public read access for approved reviews" ON public.reviews;

DROP POLICY IF EXISTS "Admin full access on therapists" ON public.therapists;
DROP POLICY IF EXISTS "Therapists can update their own profile" ON public.therapists;
DROP POLICY IF EXISTS "Public can read therapists" ON public.therapists;

ALTER TABLE IF EXISTS public.therapists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.therapists;

DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.review_status;

DROP POLICY IF EXISTS "Allow public read access to profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow therapists to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow therapists to update/delete their own images" ON storage.objects;


-- 2. SETUP PHASE: Create all database objects from scratch

-- Create custom types for status enums
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- Create the therapists table
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text UNIQUE,
    profile_image_url text,
    rating real NOT NULL DEFAULT 3.0,
    review_count integer NOT NULL DEFAULT 0,
    specialties text[],
    bio text,
    experience integer,
    is_online boolean NOT NULL DEFAULT false,
    status public.therapist_status NOT NULL DEFAULT 'pending',
    lat double precision,
    lng double precision,
    city text,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    massage_types text[],
    phone text,
    languages text[],
    certifications text[],
    therapist_number text
);
COMMENT ON TABLE public.therapists IS 'Stores public profiles for massage therapists.';

-- Create the reviews table
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    status public.review_status NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for therapists.';

-- Create a function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.therapists (id, name, email, phone, therapist_number, experience)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'therapistNumber',
    (new.raw_user_meta_data->>'experience')::integer
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a therapist profile when a new user signs up.';

-- Create a trigger to execute the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security (RLS) for the tables
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create helper function to check for admin email
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt()->>'email' = 'phillipofarrell@gmail.com';
$$;

-- RLS Policies for therapists table
CREATE POLICY "Public can read therapists" ON public.therapists
  FOR SELECT USING (true);

CREATE POLICY "Therapists can update their own profile" ON public.therapists
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin full access on therapists" ON public.therapists
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for reviews table
CREATE POLICY "Public read access for approved reviews" ON public.reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow anonymous insert on reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin full access on reviews" ON public.reviews
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for storage bucket 'profile-images'
CREATE POLICY "Allow public read access to profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Allow therapists to upload to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow therapists to update/delete their own images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow therapists to delete their own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
