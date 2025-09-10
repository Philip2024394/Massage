/*
          # [Initial Schema Setup V3]
          This script sets up the initial database schema for the 2Go Massage Hub application. It creates the necessary tables for therapists and reviews, sets up row-level security (RLS) policies to protect data, and establishes a trigger to automatically create a therapist profile when a new user signs up in the authentication system. This version corrects a syntax error from the previous script.

          ## Query Description: [This script will drop existing tables and functions if they exist to ensure a clean setup. It is designed to be run on a fresh database or to reset the existing development schema. No data will be lost if the tables do not exist yet.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Tables Created: `therapists`, `reviews`
          - Enums Created: `therapist_status`, `review_status`
          - Functions Created: `handle_new_user()`
          - Triggers Created: `on_auth_user_created` on `auth.users`
          - Storage Buckets Created: `profile-images`
          
          ## Security Implications:
          - RLS Status: Enabled on `therapists` and `reviews`.
          - Policy Changes: Yes, defines SELECT, INSERT, UPDATE, DELETE policies.
          - Auth Requirements: Policies are tied to authenticated user roles and IDs.
          
          ## Performance Impact:
          - Indexes: Primary keys are indexed automatically.
          - Triggers: Adds a trigger to `auth.users`, which runs on each new user creation.
          - Estimated Impact: Low impact on a new database.
          */

-- Drop existing objects to ensure a clean slate
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP POLICY IF EXISTS "Allow public read access to active therapists" ON public.therapists;
DROP POLICY IF EXISTS "Allow therapists to update their own profile" ON public.therapists;
DROP POLICY IF EXISTS "Allow public read access to approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow anyone to insert a new review" ON public.reviews;
DROP POLICY IF EXISTS "Allow admin full access to reviews" ON public.reviews;
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.therapists;
DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.review_status;

-- Create ENUM types for status fields
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- Create the 'therapists' table
CREATE TABLE public.therapists (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    profile_image_url TEXT,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 0.0,
    review_count INT NOT NULL DEFAULT 0,
    specialties TEXT[],
    bio TEXT,
    experience INT,
    is_online BOOLEAN NOT NULL DEFAULT false,
    status therapist_status NOT NULL DEFAULT 'pending',
    lat NUMERIC(8, 6),
    lng NUMERIC(9, 6),
    city TEXT,
    pricing_session_60 INT,
    pricing_session_90 INT,
    pricing_session_120 INT,
    massage_types TEXT[],
    phone TEXT,
    languages TEXT[],
    certifications TEXT[],
    therapist_number TEXT
);
COMMENT ON TABLE public.therapists IS 'Stores profile information for massage therapists.';

-- Create the 'reviews' table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_whatsapp TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status review_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for therapists.';

-- Create Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'therapists' table
CREATE POLICY "Allow public read access to active therapists"
ON public.therapists FOR SELECT
USING (status = 'active');

CREATE POLICY "Allow therapists to update their own profile"
ON public.therapists FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for 'reviews' table
CREATE POLICY "Allow public read access to approved reviews"
ON public.reviews FOR SELECT
USING (status = 'approved');

CREATE POLICY "Allow anyone to insert a new review"
ON public.reviews FOR INSERT
WITH CHECK (true);

-- Admin access policy (example, assumes an admin role or specific user ID)
CREATE POLICY "Allow admin full access to reviews"
ON public.reviews FOR ALL
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'phillipofarrell@gmail.com'
);
CREATE POLICY "Allow admin full access to therapists"
ON public.therapists FOR ALL
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'phillipofarrell@gmail.com'
);


-- Function to create a new therapist profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.therapists (id, name, email, phone, therapist_number, experience)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'therapist_number',
    (new.raw_user_meta_data->>'experience')::integer
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a therapist profile upon new user registration.';

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Comments on tables and columns for documentation
COMMENT ON COLUMN public.therapists.id IS 'Links to the authenticated user in auth.users.';
COMMENT ON COLUMN public.therapists.status IS 'The current status of the therapist (pending, active, blocked).';
COMMENT ON COLUMN public.reviews.status IS 'The moderation status of the review (pending, approved, rejected).';
