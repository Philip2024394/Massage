/*
# [Initial Schema Setup]
This script establishes the foundational database structure for the 2Go Massage Hub application. It creates the necessary tables, defines data types, sets up relationships, and configures security policies.

## Query Description: [This operation will create the core tables for therapists and reviews. It is safe to run on a new project but could cause conflicts if these tables already exist. No existing data will be affected as it's designed for initial setup.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tables Created: public.therapists, public.reviews
- Enums Created: public.therapist_status, public.review_status
- Functions Created: public.handle_new_user
- Triggers Created: on_auth_user_created on auth.users
- Storage Buckets: profile-images

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Policies are defined for anonymous, authenticated users, and specific user roles.]

## Performance Impact:
- Indexes: [Primary keys and foreign keys are indexed automatically.]
- Triggers: [A trigger is added to auth.users to automate profile creation.]
- Estimated Impact: [Low impact on a new database. The trigger has minimal overhead on user sign-up.]
*/

-- 1. Create custom types (Enums)
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create the therapists table
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text UNIQUE,
    profile_image_url text,
    rating real NOT NULL DEFAULT 5.0,
    review_count integer NOT NULL DEFAULT 0,
    specialties text[],
    bio text,
    experience integer,
    is_online boolean NOT NULL DEFAULT false,
    status public.therapist_status NOT NULL DEFAULT 'pending',
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
    therapist_number text
);

-- 3. Create the reviews table
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    status public.review_status NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.therapists (id, name, email, phone, therapist_number, experience)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'therapist_number',
    (new.raw_user_meta_data->>'experience')::integer
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to call the function on new user sign-up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Set up Row Level Security (RLS)
-- Enable RLS for the tables
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for therapists
CREATE POLICY "Therapists are viewable by everyone."
  ON public.therapists FOR SELECT
  USING ( true );

CREATE POLICY "Therapists can update their own profile."
  ON public.therapists FOR UPDATE
  USING ( auth.uid() = id );

-- Create RLS policies for reviews
CREATE POLICY "Approved reviews are viewable by everyone."
  ON public.reviews FOR SELECT
  USING ( status = 'approved' );

CREATE POLICY "Anyone can create a review."
  ON public.reviews FOR INSERT
  WITH CHECK ( true );

-- Note: A more specific policy for admins to manage reviews is needed.
-- This can be added later based on how admin roles are defined.
-- For now, we allow therapists to manage their own reviews as a placeholder.
CREATE POLICY "Users can manage their own reviews."
  ON public.reviews FOR ALL
  USING ( auth.uid() = (SELECT user_id FROM public.therapists WHERE id = therapist_id) );


-- 7. Create Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for the profile-images bucket
CREATE POLICY "Profile images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'profile-images' );

CREATE POLICY "Authenticated users can upload their own profile image."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'profile-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text );

CREATE POLICY "Authenticated users can update their own profile image."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'profile-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text );

CREATE POLICY "Authenticated users can delete their own profile image."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'profile-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text );
