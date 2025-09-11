-- ====================================================================
-- FINAL CORRECTED SCHEMA SCRIPT (CODE-BASED AUTH)
-- Purpose: Safely cleans up all old database objects and rebuilds the
-- entire schema from scratch to support a code-based login system.
-- Instructions: Run this entire script once in your Supabase SQL Editor.
-- ====================================================================

-- ========= STEP 1: SAFE CLEANUP =========
-- Drop dependent objects first to avoid errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop policies if they exist before dropping tables.
-- Note: Dropping tables with CASCADE will also drop dependent policies,
-- but being explicit can help in some edge cases.

-- Drop tables, cascading to remove foreign keys and other dependencies.
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.therapists CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;

-- Drop custom types (enums).
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

-- 2.2: Create Therapists Table
CREATE TABLE public.therapists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    login_code varchar(6) NOT NULL UNIQUE,
    account_number text NOT NULL UNIQUE,
    name text,
    profile_image_url text,
    rating numeric(2,1) DEFAULT 0.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    specialties text[],
    bio text,
    experience integer,
    is_online boolean DEFAULT false NOT NULL,
    status therapist_status DEFAULT 'active' NOT NULL,
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
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.therapists IS 'Stores profiles for individual massage therapists, accessed by a unique code.';

-- 2.3: Create Places Table
CREATE TABLE public.places (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    login_code varchar(6) NOT NULL UNIQUE,
    account_number text NOT NULL UNIQUE,
    name text,
    profile_image_url text,
    rating numeric(2,1) DEFAULT 0.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    address text,
    city text,
    lat double precision,
    lng double precision,
    phone text,
    services text[],
    is_online boolean DEFAULT false NOT NULL, -- Represents open/closed
    status place_status DEFAULT 'active' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.places IS 'Stores profiles for massage businesses, accessed by a unique code.';

-- 2.4: Create Reviews Table
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


-- ========= STEP 3: SEED DATA (POPULATE WITH MOCK PROFILES) =========
-- This section seeds the database with 70 therapists and 70 places,
-- each with a unique 6-character login code.

DO $$
DECLARE
    i integer;
    therapist_id uuid;
    place_id uuid;
BEGIN
    FOR i IN 1..70 LOOP
        -- Seed Therapists
        INSERT INTO public.therapists (login_code, account_number, name, phone, city, experience, is_online)
        VALUES (
            'TH' || LPAD(i::text, 4, '0'),
            'ACC-TH-' || LPAD(i::text, 4, '0'),
            'Therapist ' || i,
            '+6281234567' || LPAD(i::text, 3, '0'),
            'San Francisco',
            i % 10 + 1,
            (i % 2 = 0)
        );

        -- Seed Places
        INSERT INTO public.places (login_code, account_number, name, phone, city, address, is_online)
        VALUES (
            'PL' || LPAD(i::text, 4, '0'),
            'ACC-PL-' || LPAD(i::text, 4, '0'),
            'Massage Place ' || i,
            '+6285678901' || LPAD(i::text, 3, '0'),
            'Oakland',
            i || ' Wellness Street',
            (i % 2 = 1)
        );
    END LOOP;
END $$;


-- ========= STEP 4: ROW LEVEL SECURITY (RLS) =========
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for Therapists
CREATE POLICY "Therapist profiles are public to view" ON public.therapists FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can update therapist profiles" ON public.therapists FOR UPDATE USING (true); -- Simplified for code-based auth

-- Policies for Places
CREATE POLICY "Place profiles are public to view" ON public.places FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can update place profiles" ON public.places FOR UPDATE USING (true); -- Simplified for code-based auth

-- Policies for Reviews
CREATE POLICY "Reviews are public to view if approved" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);


-- ========= STEP 5: STORAGE SETUP =========
-- This section is idempotent. It won't fail if it has run before.

-- 5.1: Drop existing storage policies to avoid "already exists" error
DROP POLICY IF EXISTS "Profile images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a profile image." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to profile-images" ON storage.objects;

-- 5.2: Setup Storage Bucket for Profile Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5.3: Recreate Storage Policies
CREATE POLICY "Anyone can upload to profile-images" ON storage.objects
FOR INSERT TO authenticated, anon
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Profile images are publicly accessible." ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');
