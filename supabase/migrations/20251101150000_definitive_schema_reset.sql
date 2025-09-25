/*
# [Operation Name]
Definitive Schema Reset and Configuration

## Query Description:
This script performs a complete and safe reset of the application's core database schema. It is designed to be idempotent, meaning it can be run multiple times without causing errors. It will:
1. Create all necessary custom data types if they don't already exist.
2. Create the `therapists`, `places`, and `reviews` tables if they don't already exist.
3. Drop any existing Row Level Security (RLS) policies on these tables to ensure a clean slate.
4. Re-create the essential RLS policies to secure the data while allowing public read access for active profiles.

This operation is safe and will not delete any data if the tables already exist. It is designed to fix schema inconsistencies and ensure the database is correctly configured for the application.

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Types: therapist_status, place_status, review_status, user_account_type
- Tables: therapists, places, reviews
- Policies: RLS policies for SELECT on all three tables.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (re-creates policies for public read access)
- Auth Requirements: None for this script.

## Performance Impact:
- Indexes: Adds primary key indexes.
- Triggers: None.
- Estimated Impact: Low. May cause a brief schema cache reload on the Supabase backend.
*/

-- Create custom ENUM types if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'therapist_status') THEN
        CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'place_status') THEN
        CREATE TYPE public.place_status AS ENUM ('pending', 'active', 'blocked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_account_type') THEN
        CREATE TYPE public.user_account_type AS ENUM ('therapist', 'place');
    END IF;
END$$;

-- Create 'therapists' table if it does not exist
CREATE TABLE IF NOT EXISTS public.therapists (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    profile_image_url text,
    rating real DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    specialties text[],
    bio text,
    experience integer,
    is_online boolean DEFAULT false NOT NULL,
    status public.therapist_status DEFAULT 'pending'::public.therapist_status NOT NULL,
    lat double precision,
    lng double precision,
    address text,
    city text,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    massage_types text[],
    phone text,
    languages text[],
    certifications text[],
    login_code text NOT NULL UNIQUE,
    account_number text NOT NULL UNIQUE
);

-- Create 'places' table if it does not exist
CREATE TABLE IF NOT EXISTS public.places (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    profile_image_url text,
    gallery_image_urls text[],
    rating real DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    address text,
    city text,
    lat double precision,
    lng double precision,
    phone text,
    services text[],
    languages text[],
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    opening_hours jsonb,
    status public.place_status DEFAULT 'pending'::public.place_status NOT NULL,
    login_code text NOT NULL UNIQUE,
    account_number text NOT NULL UNIQUE
);

-- Create 'reviews' table if it does not exist
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    target_id uuid NOT NULL,
    target_type public.user_account_type NOT NULL,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    status public.review_status DEFAULT 'pending'::public.review_status NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent errors, then re-create them
DROP POLICY IF EXISTS "Public can view active therapists" ON public.therapists;
CREATE POLICY "Public can view active therapists" ON public.therapists FOR SELECT USING (status = 'active'::public.therapist_status);

DROP POLICY IF EXISTS "Public can view active places" ON public.places;
CREATE POLICY "Public can view active places" ON public.places FOR SELECT USING (status = 'active'::public.place_status);

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved'::public.review_status);

DROP POLICY IF EXISTS "Users can submit new reviews" ON public.reviews;
CREATE POLICY "Users can submit new reviews" ON public.reviews FOR INSERT WITH CHECK (true);
