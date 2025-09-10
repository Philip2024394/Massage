/*
# [Definitive Initial Schema Setup]
This script completely resets and rebuilds the database schema for the 2Go Massage Hub application. It first drops all existing related objects to ensure a clean state, then creates all necessary tables, types, functions, and security policies.

## Query Description: [This operation is DESTRUCTIVE to any existing 'therapists' or 'reviews' data. It will drop these tables and recreate them. This is necessary to fix previous migration errors and ensure a correct and stable database structure. No user data from `auth.users` will be deleted.]

## Metadata:
- Schema-Category: ["Dangerous", "Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [true]
- Reversible: [false]

## Structure Details:
- Drops: Tables (reviews, therapists), Functions (handle_new_user), Types (review_status, therapist_status), Policies.
- Creates: Tables (therapists, reviews), Types, Functions, Triggers, RLS Policies, Storage Bucket.

## Security Implications:
- RLS Status: Enabled on `therapists` and `reviews`.
- Policy Changes: Yes, defines all access policies from scratch.
- Auth Requirements: Policies are linked to `auth.uid()`.

## Performance Impact:
- Indexes: Primary keys and foreign keys are indexed by default.
- Triggers: An `AFTER INSERT` trigger is added to `auth.users`.
- Estimated Impact: Low. Standard setup for an application of this scale.
*/

-- Step 1: Drop existing objects to ensure a clean slate
-- Drop policies first to avoid dependency errors
DROP POLICY IF EXISTS "Enable read access for all users" ON public.therapists;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.therapists;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.therapists;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.therapists;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.reviews;
DROP POLICY IF EXISTS "Admin full access" ON public.therapists;
DROP POLICY IF EXISTS "Admin full access" ON public.reviews;

-- Drop the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables, cascading to dependent objects like foreign keys
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.therapists;

-- Drop custom types
DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.review_status;

-- Step 2: Create custom enum types
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- Step 3: Create the therapists table
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text UNIQUE,
    phone text UNIQUE,
    therapist_number text UNIQUE,
    profile_image_url text,
    bio text,
    experience integer,
    city text,
    lat double precision,
    lng double precision,
    languages text[],
    certifications text[],
    massage_types text[],
    specialties text[],
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    rating numeric(2, 1) NOT NULL DEFAULT 0.0,
    review_count integer NOT NULL DEFAULT 0,
    is_online boolean NOT NULL DEFAULT false,
    status therapist_status NOT NULL DEFAULT 'pending'
);
COMMENT ON TABLE public.therapists IS 'Stores profile information for massage therapists.';

-- Step 4: Create the reviews table
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    status review_status NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for therapists.';

-- Step 5: Set up Row Level Security (RLS)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for therapists table
CREATE POLICY "Enable read access for all users" ON public.therapists FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on id" ON public.therapists FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for reviews table
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Enable insert for any user" ON public.reviews FOR INSERT WITH CHECK (true);

-- Admin policies (assuming you have a way to identify admins, e.g., a custom claim)
-- This is a placeholder; you'd need to set up admin identification logic.
-- For now, we'll skip creating specific admin policies in this script to avoid complexity.

-- Step 6: Create a function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.therapists (id, email, name, phone, therapist_number, experience)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'therapistNumber',
    (new.raw_user_meta_data->>'experience')::integer
  );
  RETURN new;
END;
$$;

-- Step 7: Create a trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 8: Set up Storage for profile images
-- Note: This SQL only inserts the bucket metadata. The bucket must be created in the Supabase Dashboard if it doesn't exist.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-images bucket
CREATE POLICY "Enable public read access" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Enable insert for authenticated users" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-images');
CREATE POLICY "Enable update for owners" ON storage.objects FOR UPDATE TO authenticated USING (auth.uid() = owner) WITH CHECK (bucket_id = 'profile-images');
CREATE POLICY "Enable delete for owners" ON storage.objects FOR DELETE TO authenticated USING (auth.uid() = owner);

-- Step 9: Create a function to update therapist rating and review count
CREATE OR REPLACE FUNCTION public.update_therapist_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'approved' THEN
    UPDATE public.therapists
    SET
      rating = (
        SELECT AVG(r.rating)
        FROM public.reviews r
        WHERE r.therapist_id = NEW.therapist_id AND r.status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews r
        WHERE r.therapist_id = NEW.therapist_id AND r.status = 'approved'
      )
    WHERE id = NEW.therapist_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status <> 'approved') THEN
    UPDATE public.therapists
    SET
      rating = COALESCE((
        SELECT AVG(r.rating)
        FROM public.reviews r
        WHERE r.therapist_id = OLD.therapist_id AND r.status = 'approved'
      ), 0),
      review_count = COALESCE((
        SELECT COUNT(*)
        FROM public.reviews r
        WHERE r.therapist_id = OLD.therapist_id AND r.status = 'approved'
      ), 0)
    WHERE id = OLD.therapist_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 10: Create a trigger to call the rating update function
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.update_therapist_rating();
