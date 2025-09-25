/*
# [Consolidated Schema Setup]
This is a comprehensive, idempotent script that sets up the entire required database schema. It creates tables, types, and RLS policies. It is designed to be run safely multiple times, ensuring the database matches the application's requirements.

## Query Description:
This script will create the `therapists`, `places`, and `reviews` tables if they do not exist. It will also define the necessary data types (enums) and configure Row Level Security (RLS) with safe default policies. This operation is non-destructive to existing data in other tables but will establish the core structure for the application to function.

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["High"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Tables created: `therapists`, `places`, `reviews`
- Types created: `therapist_status`, `place_status`, `review_status`, `user_account_type`
- RLS Policies: Enables RLS and sets up SELECT, INSERT, UPDATE, DELETE policies for all three tables.

## Security Implications:
- RLS Status: Enabled on all three tables.
- Policy Changes: Yes. Establishes baseline security policies to allow public read access for active/approved data and block unauthorized modifications.

## Performance Impact:
- Indexes: Primary keys and UNIQUE constraints will have indexes created automatically.
- Triggers: None.
- Estimated Impact: Low. Initial setup cost.
*/

-- 1. Create Enums if they don't exist
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

-- 2. Create Therapists Table
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
COMMENT ON TABLE public.therapists IS 'Stores profiles for individual massage therapists.';

-- 3. Create Places Table
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
COMMENT ON TABLE public.places IS 'Stores profiles for massage places/spas.';

-- 4. Create Reviews Table
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
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for therapists and places.';

-- 5. Enable Row Level Security
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Therapists Policies
DROP POLICY IF EXISTS "Public can view active therapists" ON public.therapists;
CREATE POLICY "Public can view active therapists" ON public.therapists FOR SELECT USING (status = 'active'::public.therapist_status);

DROP POLICY IF EXISTS "Block all inserts on therapists" ON public.therapists;
CREATE POLICY "Block all inserts on therapists" ON public.therapists FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Block all updates on therapists" ON public.therapists;
CREATE POLICY "Block all updates on therapists" ON public.therapists FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Block all deletes on therapists" ON public.therapists;
CREATE POLICY "Block all deletes on therapists" ON public.therapists FOR DELETE USING (false);

-- Places Policies
DROP POLICY IF EXISTS "Public can view active places" ON public.places;
CREATE POLICY "Public can view active places" ON public.places FOR SELECT USING (status = 'active'::public.place_status);

DROP POLICY IF EXISTS "Block all inserts on places" ON public.places;
CREATE POLICY "Block all inserts on places" ON public.places FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Block all updates on places" ON public.places;
CREATE POLICY "Block all updates on places" ON public.places FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Block all deletes on places" ON public.places;
CREATE POLICY "Block all deletes on places" ON public.places FOR DELETE USING (false);

-- Reviews Policies
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved'::public.review_status);

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Block all updates on reviews" ON public.reviews;
CREATE POLICY "Block all updates on reviews" ON public.reviews FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Block all deletes on reviews" ON public.reviews;
CREATE POLICY "Block all deletes on reviews" ON public.reviews FOR DELETE USING (false);
