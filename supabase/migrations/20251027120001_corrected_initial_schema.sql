/*
  # [Corrected Initial Schema Setup]
  This script sets up the initial database schema for the 2Go Massage Hub application. It creates the necessary tables, types, functions, and security policies. It corrects a previous error in the `handle_new_user` function.

  ## Query Description:
  - This script is DESTRUCTIVE if run on an existing database with conflicting object names. It will drop and recreate tables, functions, and policies.
  - It is designed for a fresh setup. If you have existing data, please back it up before running this script.
  - The script sets up `therapists` and `reviews` tables, links therapist creation to user sign-ups, configures Row Level Security, and creates a storage bucket for profile images.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: true
  - Reversible: false

  ## Structure Details:
  - Tables created: `public.therapists`, `public.reviews`
  - Types created: `public.therapist_status`, `public.review_status`
  - Functions created: `public.handle_new_user`, `public.is_admin`
  - Triggers created: `on_auth_user_created` on `auth.users`
  - Storage Buckets: `profile-images`
  - RLS Policies: Enabled and configured for `therapists`, `reviews`, and `storage.objects`.

  ## Security Implications:
  - RLS Status: Enabled.
  - Policy Changes: Yes, policies are created to control data access based on user roles (anonymous, authenticated, admin).
  - Auth Requirements: Policies rely on `auth.uid()` and a custom `is_admin()` function checking the user's email.

  ## Performance Impact:
  - Indexes: Primary keys and foreign keys are indexed automatically.
  - Triggers: An `AFTER INSERT` trigger is added to `auth.users`, which has a minor performance cost on user creation.
  - Estimated Impact: Low impact on a new database.
*/

-- Drop existing objects to ensure a clean setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.therapists;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.therapist_status;


-- SECTION 1: Custom Types (Enums)
-- Create custom enum types for status fields to ensure data integrity.

CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');


-- SECTION 2: Tables
-- Create the main tables for the application.

-- therapists table: Stores profile information for massage therapists.
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text UNIQUE,
    profile_image_url text,
    rating real NOT NULL DEFAULT 0,
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
COMMENT ON TABLE public.therapists IS 'Stores profile information for massage therapists.';

-- reviews table: Stores customer reviews for therapists.
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    status public.review_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for therapists.';


-- SECTION 3: Functions and Triggers
-- Automate profile creation and define helper functions.

-- handle_new_user function: Triggered on new user creation to populate the public.therapists table.
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.therapists (id, email, name, phone, therapist_number, experience)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'therapist_number',
    (NEW.raw_user_meta_data ->> 'experience')::integer
  );
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user IS 'Creates a new therapist profile upon user registration.';

-- Trigger to execute the function after a new user is inserted into auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- is_admin function: Helper to check if the current user is an administrator.
CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  ELSE
    RETURN (SELECT auth.jwt()->>'email') = 'phillipofarrell@gmail.com';
  END IF;
END;
$$;
COMMENT ON FUNCTION public.is_admin IS 'Checks if the current user has admin privileges.';


-- SECTION 4: Row Level Security (RLS)
-- Enable and configure RLS to protect user data.

ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for therapists table
CREATE POLICY "Public can view active therapists" ON public.therapists FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view their own profile" ON public.therapists FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.therapists FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins have full access to therapists" ON public.therapists FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Policies for reviews table
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins have full access to reviews" ON public.reviews FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- SECTION 5: Storage
-- Create a public bucket for therapist profile images and set policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

COMMENT ON BUCKET "profile-images" IS 'Stores public profile images for therapists.';

-- Storage RLS Policies
CREATE POLICY "Therapists can manage their own profile images"
  ON storage.objects FOR ALL
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND owner = auth.uid());

CREATE POLICY "Profile images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');
