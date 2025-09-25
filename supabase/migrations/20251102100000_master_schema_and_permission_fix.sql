/*
# [MASTER-FIX] Full Schema, RLS, and Permissions Reset
This is a comprehensive, idempotent script designed to fix persistent "table not found" errors by resetting the entire application schema, permissions, and security policies without data loss.

## Query Description:
This script will:
1.  Ensure all required tables (`therapists`, `places`, `reviews`) and types exist.
2.  Grant explicit `SELECT` permissions to the `anon` and `authenticated` roles, which is critical for the API to see the tables.
3.  Enable Row Level Security (RLS) on all tables.
4.  Drop all existing application policies and recreate them to ensure they are correct. This allows public read access for active profiles and approved reviews, while blocking all unauthorized modifications.
5.  Force a schema cache reload for the API layer.
This operation is safe to run multiple times.

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Tables affected: `therapists`, `places`, `reviews`
- Permissions granted: `USAGE` on schema `public`, `SELECT` on tables to `anon` and `authenticated`.
- Policies recreated: Public read access policies for all three tables.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (re-creation of all public access policies)
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. May cause a brief API reload.
*/

-- Step 1: Ensure all ENUM types exist
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

-- Step 2: Ensure all tables exist with the correct columns
CREATE TABLE IF NOT EXISTS public.therapists (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    login_code character varying NOT NULL UNIQUE,
    account_number character varying NOT NULL UNIQUE,
    name character varying,
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
    city character varying,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    massage_types text[],
    phone character varying,
    languages text[],
    certifications text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.places (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    login_code character varying NOT NULL UNIQUE,
    account_number character varying NOT NULL UNIQUE,
    name character varying,
    profile_image_url text,
    gallery_image_urls text[],
    rating real DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    address text,
    city character varying,
    lat double precision,
    lng double precision,
    phone character varying,
    services text[],
    languages text[],
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    opening_hours jsonb,
    status public.place_status DEFAULT 'pending'::public.place_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    target_id uuid NOT NULL,
    target_type public.user_account_type NOT NULL,
    customer_name character varying NOT NULL,
    customer_whatsapp character varying NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    status public.review_status DEFAULT 'pending'::public.review_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 3: Grant fundamental schema and table permissions
-- This is crucial and often the missing piece.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.therapists TO anon, authenticated;
GRANT SELECT ON TABLE public.places TO anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO anon, authenticated;

-- Step 4: Enable RLS on all tables
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop and recreate all security policies to ensure correctness
-- Therapists Policies
DROP POLICY IF EXISTS "Allow public read access to active therapists" ON public.therapists;
CREATE POLICY "Allow public read access to active therapists"
ON public.therapists FOR SELECT
TO anon, authenticated
USING (status = 'active'::public.therapist_status);

-- Places Policies
DROP POLICY IF EXISTS "Allow public read access to active places" ON public.places;
CREATE POLICY "Allow public read access to active places"
ON public.places FOR SELECT
TO anon, authenticated
USING (status = 'active'::public.place_status);

-- Reviews Policies
DROP POLICY IF EXISTS "Allow public read access to approved reviews" ON public.reviews;
CREATE POLICY "Allow public read access to approved reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (status = 'approved'::public.review_status);

DROP POLICY IF EXISTS "Allow users to submit new reviews" ON public.reviews;
CREATE POLICY "Allow users to submit new reviews"
ON public.reviews FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Step 6: Force PostgREST schema cache reload
-- Adding a comment to a table is a safe way to signal a schema change.
COMMENT ON TABLE public.therapists IS 'Schema cache refresh trigger - 20251102100000';
