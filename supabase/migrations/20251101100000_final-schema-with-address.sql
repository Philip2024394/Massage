-- ====================================================================
-- FINAL SCHEMA SCRIPT with Address for Therapists
-- Purpose: Safely cleans up old objects and rebuilds the entire schema,
-- adding the 'address' field to the therapists table.
-- Instructions: Run this entire script once in your Supabase SQL Editor.
-- ====================================================================
-- ========= STEP 1: SAFE CLEANUP =========
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

ALTER TABLE public.therapists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.places DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.therapists CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;

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
    is_online boolean DEFAULT false NOT NULL,
    status place_status DEFAULT 'pending' NOT NULL,
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
BEGIN
    FOR i IN 1..70 LOOP
        faker_name := (SELECT string_agg(word, ' ') FROM (SELECT unnest(string_to_array('Lorem Ipsum Dolor Sit Amet Consectetur Adipiscing Elit', ' ')) AS word ORDER BY random() LIMIT 2) AS random_words);
        faker_city := (ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'])[floor(random()*5)+1];
        faker_lat := -6.2088 + (random() * 0.2 - 0.1);
        faker_lng := 106.8456 + (random() * 0.2 - 0.1);
        INSERT INTO public.therapists (login_code, account_number, name, experience, city, address, lat, lng, phone, status, is_online, bio, massage_types, specialties, languages, certifications, pricing_session_60, pricing_session_90, pricing_session_120)
        VALUES (
            'TH' || LPAD(i::text, 4, '0'),
            'TH-' || (1000 + i)::text,
            faker_name,
            floor(random()*10)+1,
            faker_city,
            'Street ' || (floor(random()*100)+1)::text,
            faker_lat,
            faker_lng,
            '081' || (floor(random()*900000000)+100000000)::text,
            'active',
            (random() > 0.3),
            'Experienced therapist specializing in both relaxation and therapeutic techniques.',
            (SELECT array_agg(t) FROM (SELECT unnest(ARRAY['services.massage.swedish', 'services.massage.deepTissue', 'services.massage.balinese', 'services.massage.reflexology']) AS t ORDER BY random() LIMIT 2) AS s),
            (SELECT array_agg(t) FROM (SELECT unnest(ARRAY['services.specialty.painRelief', 'services.specialty.stressReduction']) AS t ORDER BY random() LIMIT 1) AS s),
            ARRAY['English', 'Indonesian'],
            ARRAY['Certified Therapist'],
            100000, 150000, 200000
        );
    END LOOP;

    FOR i IN 1..70 LOOP
        faker_name := (SELECT string_agg(word, ' ') FROM (SELECT unnest(string_to_array('Aura Zen Oasis Serene Temple Blissful Harmony', ' ')) AS word ORDER BY random() LIMIT 2) AS random_words) || ' Spa';
        faker_city := (ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'])[floor(random()*5)+1];
        faker_lat := -6.2088 + (random() * 0.2 - 0.1);
        faker_lng := 106.8456 + (random() * 0.2 - 0.1);
        INSERT INTO public.places (login_code, account_number, name, city, address, lat, lng, phone, status, is_online, services)
        VALUES (
            'PL' || LPAD(i::text, 4, '0'),
            'PL-' || (1000 + i)::text,
            faker_name,
            faker_city,
            'Main Road ' || (floor(random()*200)+1)::text,
            faker_lat,
            faker_lng,
            '081' || (floor(random()*900000000)+100000000)::text,
            'active',
            (random() > 0.2),
            (SELECT array_agg(t) FROM (SELECT unnest(ARRAY['services.massage.balinese', 'services.place.bodyScrubs', 'services.place.facials', 'services.place.saunaSteam']) AS t ORDER BY random() LIMIT 3) AS s)
        );
    END LOOP;
END $$;

-- ========= STEP 4: SECURITY (RLS) =========
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapist profiles are public to view" ON public.therapists FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can update therapist profiles" ON public.therapists FOR UPDATE USING (true); -- Simplified for code-based auth

CREATE POLICY "Place profiles are public to view" ON public.places FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can update place profiles" ON public.places FOR UPDATE USING (true); -- Simplified for code-based auth

CREATE POLICY "Reviews are public to view if approved" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);

-- ========= STEP 5: STORAGE SETUP =========
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Profile images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'profile-images' );
CREATE POLICY "Anyone can upload a profile image." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'profile-images' );
CREATE POLICY "Anyone can update a profile image." ON storage.objects FOR UPDATE USING ( bucket_id = 'profile-images' );
