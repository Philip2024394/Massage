-- Dualite Alpha: Full Application Schema
-- This script sets up the complete database structure for therapists, places, and reviews.
-- It is designed to be run on a clean slate and will remove any conflicting old objects.

-- Clean up old objects first to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.therapists;
DROP TABLE IF EXISTS public.places;
DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.account_type;

-- Create custom types (enums)
CREATE TYPE public.account_type AS ENUM ('therapist', 'place');
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- Create Places table
CREATE TABLE public.places (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    address text,
    city text,
    phone text,
    lat numeric,
    lng numeric,
    profile_image_url text,
    services text[],
    is_online boolean DEFAULT false,
    status therapist_status DEFAULT 'pending'::therapist_status,
    rating numeric DEFAULT 0,
    review_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.places IS 'Stores profiles for massage places/businesses.';

-- Create Therapists table
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    bio text,
    experience integer,
    city text,
    phone text,
    lat numeric,
    lng numeric,
    profile_image_url text,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    massage_types text[],
    specialties text[],
    languages text[],
    certifications text[],
    therapist_number text,
    is_online boolean DEFAULT false,
    status therapist_status DEFAULT 'pending'::therapist_status,
    rating numeric DEFAULT 0,
    review_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.therapists IS 'Stores profiles for individual massage therapists.';

-- Create a unified Reviews table
CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    target_id uuid NOT NULL,
    target_type account_type NOT NULL,
    customer_name text NOT NULL,
    customer_whatsapp text,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    status review_status DEFAULT 'pending'::review_status,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores reviews for both therapists and places.';

-- Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check the account_type from the user's metadata
  IF (NEW.raw_user_meta_data->>'account_type' = 'therapist') THEN
    INSERT INTO public.therapists (id, name, phone, experience, therapist_number)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'phone',
      (NEW.raw_user_meta_data->>'experience')::integer,
      NEW.raw_user_meta_data->>'therapistNumber'
    );
  ELSIF (NEW.raw_user_meta_data->>'account_type' = 'place') THEN
    INSERT INTO public.places (id, name, phone, address, city)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'city'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
-- Enable RLS for all tables
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for 'places'
CREATE POLICY "Allow public read access to active places" ON public.places FOR SELECT USING (status = 'active'::therapist_status);
CREATE POLICY "Allow place owner to update their own profile" ON public.places FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin full access to places" ON public.places FOR ALL USING (true); -- Simplified for now

-- Policies for 'therapists'
CREATE POLICY "Allow public read access to active therapists" ON public.therapists FOR SELECT USING (status = 'active'::therapist_status);
CREATE POLICY "Allow therapist to update their own profile" ON public.therapists FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin full access to therapists" ON public.therapists FOR ALL USING (true); -- Simplified for now

-- Policies for 'reviews'
CREATE POLICY "Allow public read access to approved reviews" ON public.reviews FOR SELECT USING (status = 'approved'::review_status);
CREATE POLICY "Allow anyone to insert a new review" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access to reviews" ON public.reviews FOR ALL USING (true); -- Simplified for now

-- Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Allow authenticated users to upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow owners to update their profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid() = owner);
