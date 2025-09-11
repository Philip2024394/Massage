-- ====================================================================
-- FINAL SCHEMA SCRIPT (v3)
-- Purpose: This script fixes the registration bug permanently. It safely
-- cleans up the database and rebuilds the schema with automatic, unique
-- account number generation for both therapists and places.
-- Instructions: Run this entire script once in your Supabase SQL Editor.
-- ====================================================================

-- ========= STEP 1: SAFE CLEANUP =========
-- Drop dependent objects first to avoid errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Drop tables, cascading to remove foreign keys and other dependencies.
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.therapists CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;
-- Drop custom types (enums).
DROP TYPE IF EXISTS public.user_account_type;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.place_status;
-- Drop sequences if they exist to ensure a clean slate.
DROP SEQUENCE IF EXISTS public.therapist_account_no_seq;
DROP SEQUENCE IF EXISTS public.place_account_no_seq;

-- ========= STEP 2: SCHEMA CREATION =========
-- 2.1: Create custom types (Enums)
CREATE TYPE public.user_account_type AS ENUM ('therapist', 'place');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.place_status AS ENUM ('pending', 'active', 'blocked');

-- 2.2: Create Sequences for unique, auto-incrementing Account Numbers
CREATE SEQUENCE public.therapist_account_no_seq START 1001;
CREATE SEQUENCE public.place_account_no_seq START 1001;

-- 2.3: Create Therapists Table with auto-generated account_number
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL UNIQUE DEFAULT ('TH-' || nextval('therapist_account_no_seq')),
    name text,
    phone text UNIQUE,
    experience integer,
    city text,
    bio text,
    profile_image_url text,
    languages text[],
    certifications text[],
    massage_types text[],
    specialties text[],
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    lat double precision,
    lng double precision,
    is_online boolean DEFAULT false NOT NULL,
    rating numeric(2,1) DEFAULT 0.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    status therapist_status DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.therapists IS 'Stores profiles for individual massage therapists.';

-- 2.4: Create Places Table with auto-generated account_number
CREATE TABLE public.places (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL UNIQUE DEFAULT ('PL-' || nextval('place_account_no_seq')),
    name text,
    phone text UNIQUE,
    address text,
    city text,
    profile_image_url text,
    services text[],
    lat double precision,
    lng double precision,
    is_online boolean DEFAULT false NOT NULL,
    rating numeric(2,1) DEFAULT 0.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    status place_status DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.places IS 'Stores profiles for massage businesses/places.';

-- 2.5: Create Reviews Table
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id uuid NOT NULL,
    target_type user_account_type NOT NULL,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    status review_status DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores reviews for both therapists and places.';

-- ========= STEP 3: AUTOMATION & SECURITY =========
-- 3.1: Create a robust function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    account_type text;
BEGIN
    account_type := new.raw_user_meta_data ->> 'account_type';

    IF account_type = 'therapist' THEN
        INSERT INTO public.therapists (id, name, phone, experience)
        VALUES (
            new.id,
            new.raw_user_meta_data ->> 'name',
            new.raw_user_meta_data ->> 'phone',
            (new.raw_user_meta_data ->> 'experience')::integer
        );
    ELSIF account_type = 'place' THEN
        INSERT INTO public.places (id, name, phone, address, city)
        VALUES (
            new.id,
            new.raw_user_meta_data ->> 'name',
            new.raw_user_meta_data ->> 'phone',
            new.raw_user_meta_data ->> 'address',
            new.raw_user_meta_data ->> 'city'
        );
    END IF;
    
    RETURN new;
END;
$$;

-- 3.2: Create the trigger on the auth.users table
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3.3: Setup Row Level Security (RLS)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapist profiles are public to view" ON public.therapists FOR SELECT USING (status = 'active');
CREATE POLICY "Therapists can insert their own profile" ON public.therapists FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Therapists can update their own profile" ON public.therapists FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Place profiles are public to view" ON public.places FOR SELECT USING (status = 'active');
CREATE POLICY "Place owners can insert their own profile" ON public.places FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Place owners can update their own profile" ON public.places FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Reviews are public to view if approved" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);

-- ========= STEP 4: STORAGE SETUP =========
-- This part is idempotent, it won't fail if it has run before.
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies before creating them to avoid errors on re-run
DROP POLICY IF EXISTS "Profile images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a profile image." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image." ON storage.objects;

CREATE POLICY "Profile images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'profile-images' );
CREATE POLICY "Anyone can upload a profile image." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'profile-images' );
CREATE POLICY "Users can update their own profile image." ON storage.objects FOR UPDATE USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'profile-images' );
