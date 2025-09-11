-- ====================================================================
-- FINAL IDEMPOTENT SCHEMA SCRIPT
-- Purpose: Safely cleans up any old database objects and rebuilds the
-- entire schema from scratch to support the code-based login system.
-- Instructions: Run this entire script once in your Supabase SQL Editor.
-- ====================================================================
-- ========= STEP 1: SAFE CLEANUP =========
-- Drop policies first, checking if they exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own profile image.') THEN
    DROP POLICY "Users can update their own profile image." ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can upload a profile image.') THEN
    DROP POLICY "Anyone can upload a profile image." ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Profile images are publicly accessible.') THEN
    DROP POLICY "Profile images are publicly accessible." ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can submit a review') THEN
    DROP POLICY "Anyone can submit a review" ON public.reviews;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Reviews are public to view if approved') THEN
    DROP POLICY "Reviews are public to view if approved" ON public.reviews;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Place owners can update their own profile') THEN
    DROP POLICY "Place owners can update their own profile" ON public.places;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Place owners can insert their own profile') THEN
    DROP POLICY "Place owners can insert their own profile" ON public.places;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Place profiles are public to view') THEN
    DROP POLICY "Place profiles are public to view" ON public.places;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Therapists can update their own profile') THEN
    DROP POLICY "Therapists can update their own profile" ON public.therapists;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Therapists can insert their own profile') THEN
    DROP POLICY "Therapists can insert their own profile" ON public.therapists;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Therapist profiles are public to view') THEN
    DROP POLICY "Therapist profiles are public to view" ON public.therapists;
  END IF;
END $$;
-- Drop tables, cascading to remove dependencies.
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.therapists CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;
-- Drop custom types.
DROP TYPE IF EXISTS public.user_account_type;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.place_status;
-- ========= STEP 2: SCHEMA CREATION =========
CREATE TYPE public.user_account_type AS ENUM ('therapist', 'place');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.place_status AS ENUM ('pending', 'active', 'blocked');
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    login_code character varying(6) NOT NULL UNIQUE,
    account_number text NOT NULL UNIQUE,
    name text,
    profile_image_url text,
    rating numeric(2,1) DEFAULT 0.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    specialties text[],
    bio text,
    experience integer,
    is_online boolean DEFAULT false NOT NULL,
    status therapist_status DEFAULT 'pending' NOT NULL,
    address text,
    city text,
    lat double precision,
    lng double precision,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    massage_types text[],
    phone text,
    languages text[],
    certifications text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.places (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    login_code character varying(6) NOT NULL UNIQUE,
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
    opening_hours jsonb,
    status place_status DEFAULT 'pending' NOT NULL,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
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
-- ========= STEP 3: SEED DATA (with 6-character codes) =========
DO $$
DECLARE
    i int;
    faker_name text;
    faker_city text;
    faker_lat double precision;
    faker_lng double precision;
    default_hours jsonb := '{
        "monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"},
        "wednesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"},
        "friday": {"open": "09:00", "close": "20:00"}, "saturday": {"open": "10:00", "close": "20:00"},
        "sunday": {"open": null, "close": null}
    }';
BEGIN
    FOR i IN 1..70 LOOP
        faker_name := (SELECT string_agg(word, ' ') FROM (SELECT unnest(string_to_array('Lorem Ipsum Dolor Sit Amet Consectetur Adipiscing Elit', ' ')) AS word ORDER BY random() LIMIT 2) AS random_words);
        faker_city := (ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'])[floor(random()*5)+1];
        faker_lat := -6.2088 + (random() * 0.2 - 0.1);
        faker_lng := 106.8456 + (random() * 0.2 - 0.1);
        INSERT INTO public.therapists (login_code, account_number, name, experience, city, address, lat, lng, phone, status, is_online, bio, massage_types, specialties, languages, certifications, pricing_session_60, pricing_session_90, pricing_session_120)
        VALUES (
            'TH' || LPAD(i::text, 4, '0'), 'TH-' || (1000 + i)::text, faker_name, floor(random() * 15 + 1)::int, faker_city,
            (SELECT string_agg(word, ' ') FROM (SELECT unnest(string_to_array('Jalan Mawar Melati Anggrek Kamboja', ' ')) AS word ORDER BY random() LIMIT 2) AS random_words) || ' No. ' || floor(random() * 100 + 1)::int,
            faker_lat, faker_lng, '81' || floor(random() * 900000000 + 100000000)::text, 'active', (random() > 0.3),
            'Experienced therapist specializing in both relaxation and therapeutic techniques.',
            (SELECT array_agg(elem) FROM (SELECT unnest(ARRAY['services.massage.swedish', 'services.massage.deepTissue', 'services.massage.balinese', 'services.massage.hotStone', 'services.massage.reflexology']) AS elem ORDER BY random() LIMIT 3) AS s),
            (SELECT array_agg(elem) FROM (SELECT unnest(ARRAY['services.specialty.painRelief', 'services.specialty.stressReduction', 'services.specialty.relaxation']) AS elem ORDER BY random() LIMIT 2) AS s),
            ARRAY['Indonesian', 'English'], ARRAY['Certified Therapist'], 150000, 200000, 250000
        );
        INSERT INTO public.places (login_code, account_number, name, city, address, lat, lng, phone, status, services, opening_hours, pricing_session_60, pricing_session_90, pricing_session_120)
        VALUES (
            'PL' || LPAD(i::text, 4, '0'), 'PL-' || (1000 + i)::text, faker_name || ' Spa', faker_city,
            (SELECT string_agg(word, ' ') FROM (SELECT unnest(string_to_array('Jalan Sudirman Thamrin Gatot Subroto', ' ')) AS word ORDER BY random() LIMIT 2) AS random_words) || ' No. ' || floor(random() * 100 + 1)::int,
            faker_lat, faker_lng, '81' || floor(random() * 900000000 + 100000000)::text, 'active',
            (SELECT array_agg(elem) FROM (SELECT unnest(ARRAY['services.massage.swedish', 'services.massage.balinese', 'services.place.bodyScrubs', 'services.place.facials', 'services.place.saunaSteam']) AS elem ORDER BY random() LIMIT 4) AS s),
            default_hours, 180000, 240000, 300000
        );
    END LOOP;
END $$;
-- ========= STEP 4: RLS POLICIES & STORAGE =========
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Therapist profiles are public to view" ON public.therapists FOR SELECT USING (true);
CREATE POLICY "Place profiles are public to view" ON public.places FOR SELECT USING (true);
CREATE POLICY "Reviews are public to view if approved" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin has full access" ON public.therapists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin has full access" ON public.places FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin has full access" on public.reviews FOR ALL USING (true) WITH CHECK (true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Profile images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'profile-images' );
CREATE POLICY "Anyone can upload a profile image." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'profile-images' );
