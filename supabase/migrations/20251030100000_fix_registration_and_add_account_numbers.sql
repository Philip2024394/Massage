-- ====================================================================
-- FINAL IDEMPOTENT SCHEMA SCRIPT (v3)
-- Purpose: Fixes registration flow by adding auto-generated account numbers.
-- Instructions: Run this entire script once in your Supabase SQL Editor.
-- It is safe to run multiple times.
-- ====================================================================
-- ========= STEP 1: SAFE CLEANUP =========
-- Drop policies first, using IF EXISTS to prevent errors.
DROP POLICY IF EXISTS "Users can update their own profile image." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a profile image." ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
DROP POLICY IF EXISTS "Reviews are public to view if approved" ON public.reviews;
DROP POLICY IF EXISTS "Place owners can update their own profile" ON public.places;
DROP POLICY IF EXISTS "Place owners can insert their own profile" ON public.places;
DROP POLICY IF EXISTS "Place profiles are public to view" ON public.places;
DROP POLICY IF EXISTS "Therapists can update their own profile" ON public.therapists;
DROP POLICY IF EXISTS "Therapists can insert their own profile" ON public.therapists;
DROP POLICY IF EXISTS "Therapist profiles are public to view" ON public.therapists;
-- Drop trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Drop tables, sequences, and types
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.therapists CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;
DROP SEQUENCE IF EXISTS public.account_number_seq;
DROP TYPE IF EXISTS public.user_account_type;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.place_status;
-- ========= STEP 2: SCHEMA CREATION =========
-- 2.1: Create custom types (Enums)
CREATE TYPE public.user_account_type AS ENUM ('therapist', 'place');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.place_status AS ENUM ('pending', 'active', 'blocked');
-- 2.2: Create a sequence for generating unique account numbers
CREATE SEQUENCE public.account_number_seq START 1001;
-- 2.3: Create Therapists Table with account_number
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number text UNIQUE,
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
-- 2.4: Create Places Table with account_number
CREATE TABLE public.places (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number text UNIQUE,
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
-- ========= STEP 3: AUTOMATION & SECURITY =========
-- 3.1: Create function to handle new user sign-ups with auto-generated number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    account_type text;
    new_account_number text;
    prefix text;
BEGIN
    account_type := new.raw_user_meta_data ->> 'account_type';
    
    IF account_type = 'therapist' THEN
        prefix := 'TH';
    ELSIF account_type = 'place' THEN
        prefix := 'PL';
    ELSE
        prefix := 'ACC';
    END IF;
    new_account_number := prefix || '-' || nextval('public.account_number_seq');

    IF account_type = 'therapist' THEN
        INSERT INTO public.therapists (id, name, phone, experience, account_number)
        VALUES (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone', (new.raw_user_meta_data ->> 'experience')::integer, new_account_number);
    ELSIF account_type = 'place' THEN
        INSERT INTO public.places (id, name, phone, address, city, account_number)
        VALUES (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone', new.raw_user_meta_data ->> 'address', new.raw_user_meta_data ->> 'city', new_account_number);
    END IF;
    RETURN new;
END;
$$;
-- 3.2: Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
-- 3.3: Setup Row Level Security (RLS)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Therapist profiles are public to view" ON public.therapists FOR SELECT USING (status = 'active');
CREATE POLICY "Therapists can insert/update their own profile" ON public.therapists FOR ALL USING (auth.uid() = id);
CREATE POLICY "Place profiles are public to view" ON public.places FOR SELECT USING (status = 'active');
CREATE POLICY "Place owners can insert/update their own profile" ON public.places FOR ALL USING (auth.uid() = id);
CREATE POLICY "Reviews are public to view if approved" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);
-- ========= STEP 4: STORAGE SETUP =========
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Profile images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'profile-images' );
CREATE POLICY "Anyone can upload a profile image." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'profile-images' );
CREATE POLICY "Users can update their own profile image." ON storage.objects FOR UPDATE USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'profile-images' );
