/*
# [Migration] Complete Schema Reset and Creation
This script will completely reset and rebuild the application's database schema. It is designed to be run on a database that may be in an inconsistent state from previous failed migrations.

## Query Description:
- **WARNING: This is a DESTRUCTIVE operation.** It will first attempt to drop existing tables ('reviews', 'therapists'), functions, and types related to the application. This will permanently delete any data in those tables.
- It then recreates the entire schema from scratch, including tables, relationships, security policies (RLS), and the necessary trigger for user profile creation.
- It also sets up the 'profile-images' storage bucket and its access policies.

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Drops: 'reviews' table, 'therapists' table, 'handle_new_user' function, 'on_auth_user_created' trigger, 'review_status' enum, 'therapist_status' enum.
- Creates: All of the above objects in the correct order.
- Storage: Creates 'profile-images' bucket and policies.

## Security Implications:
- RLS Status: Enabled on 'therapists' and 'reviews' tables.
- Policy Changes: Yes, defines all access policies from scratch.
  - Therapists can be read by anyone if 'active'.
  - Therapists can only be updated by the owning user.
  - Reviews can be read by anyone if 'approved'.
  - Anyone can create a 'pending' review.
- Auth Requirements: Relies on Supabase Auth (auth.users).

## Performance Impact:
- Indexes: Creates primary keys and foreign key indexes.
- Triggers: Creates one trigger on 'auth.users' for new user setup.
- Estimated Impact: Low, standard setup.
*/

-- Step 1: Drop existing objects in reverse order of dependency to avoid errors.
-- Use 'IF EXISTS' to allow the script to run even if objects are missing.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.therapists;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.therapist_status;

-- Step 2: Create custom types (enums)
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- Step 3: Create the 'therapists' table
-- This table stores public-facing profile information for therapists.
CREATE TABLE public.therapists (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    profile_image_url TEXT,
    bio TEXT,
    experience INT,
    is_online BOOLEAN DEFAULT false NOT NULL,
    status public.therapist_status DEFAULT 'pending' NOT NULL,
    city TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    phone TEXT,
    therapist_number TEXT,
    languages TEXT[],
    certifications TEXT[],
    specialties TEXT[],
    massage_types TEXT[],
    pricing_session_60 INT,
    pricing_session_90 INT,
    pricing_session_120 INT,
    rating NUMERIC(2, 1) DEFAULT 0.0 NOT NULL,
    review_count INT DEFAULT 0 NOT NULL
);
COMMENT ON TABLE public.therapists IS 'Stores profile information for massage therapists.';

-- Step 4: Create the 'reviews' table
-- This table stores reviews submitted by customers for therapists.
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_whatsapp TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status public.review_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for therapists.';

-- Step 5: Set up Row Level Security (RLS)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
-- Therapists Table Policies
CREATE POLICY "Therapist profiles are public if active"
  ON public.therapists FOR SELECT
  USING (status = 'active');

CREATE POLICY "Therapists can insert their own profile"
  ON public.therapists FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Therapists can update their own profile"
  ON public.therapists FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Reviews Table Policies
CREATE POLICY "Reviews are public if approved"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Anyone can submit a review"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- Step 7: Create function to handle new user registration
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
    (new.raw_user_meta_data->>'experience')::INT
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a therapist profile when a new user signs up.';

-- Step 8: Create a trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 9: Set up Storage for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop policies if they exist, to ensure a clean slate
DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can update/delete their own images" ON storage.objects;

-- Create Storage Policies
CREATE POLICY "Profile images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "Therapists can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Therapists can update/delete their own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
