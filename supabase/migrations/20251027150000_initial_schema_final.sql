/*
# [Migration] Initial Schema Setup - Final Corrected Version

This script provides a complete and corrected setup for the initial database schema. It is designed to be run on a fresh database or to clean up and replace any previously failed migration attempts.

## Query Description:
This operation will completely reset the application's database tables ('therapists', 'reviews') and related functions/triggers.
- **Safety:** It starts by dropping existing objects to ensure a clean state. If you have any manually added data in these tables, it will be lost.
- **Recommendation:** This script is intended to establish the foundational schema. No backup is needed if you are just setting up the project.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- **Tables Dropped:** public.reviews, public.therapists
- **Types Dropped:** public.review_status, public.therapist_status
- **Functions/Triggers Dropped:** public.handle_new_user, on_auth_user_created
- **Tables Created:** public.therapists, public.reviews
- **Types Created:** public.review_status, public.therapist_status
- **Functions/Triggers Created:** public.handle_new_user, on_auth_user_created
- **Storage Bucket:** 'profile-images' policies created.

## Security Implications:
- RLS Status: Enabled on 'therapists' and 'reviews'.
- Policy Changes: Defines SELECT, INSERT, UPDATE policies for public and authenticated users.
- Auth Requirements: Policies are based on JWT claims (uid(), role).

## Performance Impact:
- Indexes: Primary keys and foreign keys create indexes automatically.
- Triggers: An AFTER INSERT trigger is added to `auth.users`.
- Estimated Impact: Low, as this is for initial setup.
*/

-- 1. CLEANUP: Drop existing objects to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.therapists;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.therapist_status;

-- 2. CREATE ENUM TYPES for status fields
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. CREATE THERAPISTS TABLE
-- This table stores public profiles for massage therapists.
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text,
    phone text,
    therapist_number text,
    profile_image_url text,
    bio text,
    experience integer,
    city text,
    lat double precision,
    lng double precision,
    massage_types text[],
    specialties text[],
    languages text[],
    certifications text[],
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    rating numeric DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    is_online boolean DEFAULT false NOT NULL,
    status therapist_status DEFAULT 'pending'::public.therapist_status NOT NULL
);
COMMENT ON TABLE public.therapists IS 'Stores public profiles for massage therapists.';

-- 4. CREATE REVIEWS TABLE
-- This table stores reviews submitted by customers for therapists.
CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating &gt;= 1 AND rating &lt;= 5),
    comment text NOT NULL,
    status review_status DEFAULT 'pending'::public.review_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for therapists.';

-- 5. SETUP ROW LEVEL SECURITY (RLS)
-- Enable RLS for all tables
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Therapists Table
CREATE POLICY "Public can view active therapists" ON public.therapists FOR SELECT USING (status = 'active'::public.therapist_status);
CREATE POLICY "Therapists can view their own profile" ON public.therapists FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Therapists can update their own profile" ON public.therapists FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Reviews Table
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved'::public.review_status);
CREATE POLICY "Anyone can submit a new review" ON public.reviews FOR INSERT WITH CHECK (true);

-- 6. CREATE FUNCTION TO HANDLE NEW USER SIGN-UP
-- This function automatically creates a therapist profile when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.therapists (id, email, name, phone, therapist_number, experience)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data-&gt;&gt;'name',
    NEW.raw_user_meta_data-&gt;&gt;'phone',
    NEW.raw_user_meta_data-&gt;&gt;'therapistNumber',
    (NEW.raw_user_meta_data-&gt;&gt;'experience')::integer
  );
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a therapist profile upon new user registration.';

-- 7. CREATE TRIGGER to call the function on new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

-- 8. SETUP STORAGE BUCKET AND POLICIES for profile images
-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
CREATE POLICY "Public can view profile images" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Therapists can upload their own profile image" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Therapists can update their own profile image" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
