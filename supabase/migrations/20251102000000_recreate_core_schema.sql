/*
# [Recreate Core Application Schema]
This migration script ensures that the core tables (`therapists`, `places`, `reviews`) and their required ENUM types exist in the database. It is designed to be run if these tables are missing, which can cause application errors.

## Query Description:
This script will create the `therapists`, `places`, and `reviews` tables along with the necessary ENUM types for status fields. It uses `IF NOT EXISTS` to prevent errors if parts of the schema already exist. This is a structural change and is safe to run on a database that is missing these tables. It will not delete or modify any existing data in other tables.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false (Dropping tables would be required)

## Structure Details:
- **ENUMS Created:**
  - `therapist_status`: ('pending', 'active', 'blocked')
  - `place_status`: ('pending', 'active', 'blocked')
  - `review_status`: ('pending', 'approved', 'rejected')
  - `user_account_type`: ('therapist', 'place')
- **Tables Created:**
  - `therapists`: Stores therapist profiles.
  - `places`: Stores massage place profiles.
  - `reviews`: Stores reviews for both therapists and places.

## Security Implications:
- RLS Status: Disabled by default on new tables. The script does not enable RLS.
- Policy Changes: No
- Auth Requirements: None for this script.

## Performance Impact:
- Indexes: Primary keys are indexed automatically. No other indexes are added in this script.
- Triggers: No triggers are added.
- Estimated Impact: Low. Table creation is a quick operation.
*/

-- Create ENUM types if they don't exist
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


-- Create therapists table
CREATE TABLE IF NOT EXISTS public.therapists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    login_code text NOT NULL UNIQUE,
    account_number text NOT NULL,
    name text,
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
    address text,
    city text,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    massage_types text[],
    phone text,
    languages text[],
    certifications text[],
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create places table
CREATE TABLE IF NOT EXISTS public.places (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    login_code text NOT NULL UNIQUE,
    account_number text NOT NULL,
    name text,
    profile_image_url text,
    gallery_image_urls text[],
    rating real NOT NULL DEFAULT 0,
    review_count integer NOT NULL DEFAULT 0,
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
    status public.place_status NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id uuid NOT NULL,
    target_type public.user_account_type NOT NULL,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    status public.review_status NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Grant usage on new types to public roles
GRANT USAGE ON TYPE public.therapist_status TO anon, authenticated;
GRANT USAGE ON TYPE public.place_status TO anon, authenticated;
GRANT USAGE ON TYPE public.review_status TO anon, authenticated;
GRANT USAGE ON TYPE public.user_account_type TO anon, authenticated;

-- Grant permissions on tables
GRANT SELECT ON TABLE public.therapists TO anon, authenticated;
GRANT SELECT ON TABLE public.places TO anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO anon, authenticated;

-- Grant modification permissions for authenticated users (for dashboards) and anon (for reviews)
GRANT INSERT, UPDATE, DELETE ON TABLE public.therapists TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.places TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.reviews TO authenticated, anon;
